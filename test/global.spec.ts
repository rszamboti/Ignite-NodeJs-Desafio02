import { execSync } from 'child_process';
import request from 'supertest';
import { app } from '../src/app';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
beforeAll(async () => {
  await app.ready()
})
afterAll(async () => {
  await app.close()
})
beforeEach(() => {
  execSync('npm run knex migrate:rollback --all')
  execSync('npm run knex migrate:latest')
})

describe('Users routes', () => {
 
  it('should be able to create a new user', async () => {
    const response = await request(app.server).post('/users').send({ name: 'Ricardo', email: 'ricardo@email.com' }).expect(201)

    const cookies = response.get('Set-Cookie')
    console.log(cookies)
    expect(cookies).toEqual(
      expect.arrayContaining([expect.stringContaining('sessionId')]),
    )
  })
  
})
describe('Meals routes', () => {
  it('should be able to create a new meal', async () => {
    const userResponse = await request(app.server).post('/users').send({ name: 'Ricardo', email: 'ricardo@email.com' }).expect(201)

    const cookies = userResponse.get('Set-Cookie')

    await request(app.server).post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'Cafe da Manha',
        description: "Cafe`s",
        isdiet: true,
        date: new Date(),
      }).expect(201)
  })

  it('should be able to list all meals from a user', async () => {
    const userResponse = await request(app.server).post('/users').send({ name: 'Ricardo', email: 'ricardo@email.com' }).expect(201)
    const cookies = userResponse.get('Set-Cookie')
    await request(app.server).post('/meals').set('Cookie', cookies)
      .send({
        name: 'Almoco',
        description: "Almoco`s",
        isdiet: true,
        date: new Date(),
      }).expect(201)

    await request(app.server).post('/meals').set('Cookie', cookies)
      .send({
        name: 'Cafe',
        description: "Cafe",
        isdiet: true,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day after
      }).expect(201)

    const mealsResponse = await request(app.server).get('/meals').set('Cookie', cookies).expect(200)

    expect(mealsResponse.body.meals).toHaveLength(2)

    // This validate if the order is correct
    expect(mealsResponse.body.meals[1].name).toBe('Almoco')
    expect(mealsResponse.body.meals[0].name).toBe('Cafe')
  })

  it('should be able to show a single meal', async () => {
    const userResponse = await request(app.server).post('/users').send({ name: 'Ricardo', email: 'ricardo@email.com' }).expect(201)
    const cookies = userResponse.get('Set-Cookie')
    await request(app.server).post('/meals').set('Cookie', cookies)
    .send({
        name: 'Cafe',
        description: "Cafe",
        isdiet: true,
        date: new Date(),
      }).expect(201)

    const mealsResponse = await request(app.server).get('/meals').set('Cookie', cookies).expect(200)

    const mealId = mealsResponse.body.meals[0].id

    const mealResponse = await request(app.server).get(`/meals/${mealId}`).set('Cookie', cookies).expect(200)

    expect(mealResponse.body).toEqual({
      meal: expect.objectContaining({
        name: 'Cafe',
        description: "Cafe",
        isdiet: 1,
        date: expect.any(Number),
      }),
    })
  })

  it('should be able to update a meal from a user', async () => {
    const userResponse = await request(app.server).post('/users')
      .send({ name: 'Ricardo', email: 'ricardo@email.com' }).expect(201)
    const cookies = userResponse.get('Set-Cookie')
    await request(app.server).post('/meals').set('Cookie', cookies)
    .send({
        name: 'Jantar',
        description: "Jantar",
        isdiet: true,
        date: new Date(),
      }).expect(201)

    const mealsResponse = await request(app.server).get('/meals').set('Cookie', cookies).expect(200)

    const mealId = mealsResponse.body.meals[0].id

    await request(app.server).put(`/meals/${mealId}`).set('Cookie', cookies)
    .send({
        name: 'Almoco',
        description: "Almoco",
        isdiet: true,
        date: new Date(),
      }).expect(204)
  })

  it('should be able to delete a meal from a user', async () => {
    const userResponse = await request(app.server).post('/users')
      .send({ name: 'Ricardo', email: 'ricardo@email.com' }).expect(201)
    const cookies = userResponse.get('Set-Cookie')
    await request(app.server).post('/meals').set('Cookie', cookies)
      .send({
        name: 'Cafe',
        description: "CAfe",
        isdiet: true,
        date: new Date(),
      }).expect(201)

    const mealsResponse = await request(app.server).get('/meals').set('Cookie', cookies).expect(200)

    const mealId = mealsResponse.body.meals[0].id

    await request(app.server).delete(`/meals/${mealId}`)
        .set('Cookie', cookies).expect(204)
  })

  it('should be able to get metrics from a user', async () => {
    const userResponse = await request(app.server).post('/users').send({ name: 'Ricardo', email: 'ricardo@email.com' }).expect(201)
    const cookies = userResponse.get('Set-Cookie')
    await request(app.server).post('/meals').set('Cookie', cookies)
    .send({
        name: 'batata',
        description: "batata`s",
        isdiet: true,
        date: new Date('2024-04-01T08:00:00'),
      }).expect(201)

    await request(app.server).post('/meals').set('Cookie', cookies)
      .send({
        name: 'Almoco',
        description: "Almoco",
        isdiet: false,
        date: new Date('2024-04-01T10:00:00'),
      }).expect(201)

    await request(app.server).post('/meals').set('Cookie', cookies)
      .send({
        name: 'Petisco',
        description: "Diversos",
        isdiet: true,
        date: new Date('2024-04-01T12:00:00'),
      }).expect(201)

    await request(app.server).post('/meals').set('Cookie', cookies)
      .send({
        name: 'ciesta',
        description: "ciesta",
        isdiet: true,
        date: new Date('2024-04-01T17:00:00'),
      })

    await request(app.server).post('/meals').set('Cookie', cookies)
      .send({
        name: 'Cafe',
        description: "Cafe",
        isdiet: true,
        date: new Date('2024-04-02T08:00:00'),
      })

    const metricsResponse = await request(app.server).get('/meals/metrics')
        .set('Cookie', cookies).expect(200)

    expect(metricsResponse.body).toEqual({
      totalMeals: 5,
      totalMealsOnDiet: 4,
      totalMealsOffDiet: 1,
      bestOnDietSequence: 3,
    })
  })
 
})
