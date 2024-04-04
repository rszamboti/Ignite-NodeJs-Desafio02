import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { checkSessionIdExists } from '../middlewares/check-session'
import crypto from 'node:crypto'
import { knex } from '../database'

export async function mealsRoutes(app: FastifyInstance) {
  app.post('/',{ preHandler: [checkSessionIdExists] },async (request, reply) => {
      const createRefeicaoBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        isdiet: z.boolean(),
        date: z.coerce.date(),
      })
      //console.log(request.body)

      const { name, description, isdiet, date } = createRefeicaoBodySchema.parse(request.body)

      await knex('meals').insert({
        id: crypto.randomUUID(),
        name,
        description,
        isdiet,
        date: date.getTime(),
        user_id: request.user?.id,
      })
      return reply.status(201).send()
    },
  )

  app.get('/',{ preHandler: [checkSessionIdExists] },async (request, reply) => {
      const meals = await knex('meals')
        .where({ user_id: request.user?.id })
        .orderBy('date', 'desc')
      //console.log(meals)
      return reply.send({ meals })
    },
  )

  app.get('/:mealId',{ preHandler: [checkSessionIdExists] },async (request, reply) => {
      const paramsSchema = z.object({ mealId: z.string().uuid() })

      const { mealId } = paramsSchema.parse(request.params)

      const meal = await knex('meals').where({ id: mealId }).first()

      if (!meal) {
        return reply.status(404).send({ error: 'Refeicao not found' })
      }

      return reply.send({ meal })
    },
  )

  app.put('/:mealId',{ preHandler: [checkSessionIdExists] },async (request, reply) => {
    const paramsSchema = z.object({ mealId: z.string().uuid() })

      const { mealId } = paramsSchema.parse(request.params)

      const updateRefeicaoBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        isdiet: z.boolean(),
        date: z.coerce.date(),
      })

      const { name, description, isdiet, date } = updateRefeicaoBodySchema.parse(
        request.body,
      )

      const meal = await knex('meals').where({ id: mealId }).first()

      if (!meal) {
        return reply.status(404).send({ error: 'Refeicao not found' })
      }

      await knex('meals').where({ id: mealId }).update({
        name,
        description,
        isdiet,
        date: date.getTime(),
      })

      return reply.status(204).send()
    },
  )

  app.delete('/:mealId',{ preHandler: [checkSessionIdExists] },async (request, reply) => {
    const paramsSchema = z.object({ mealId: z.string().uuid() })

      const { mealId } = paramsSchema.parse(request.params)

      const refeicao = await knex('meals').where({ id: mealId }).first()

      if (!refeicao) {
        return reply.status(404).send({ error: 'Refeicao not found' })
      }

      await knex('meals').where({ id: mealId }).delete()

      return reply.status(204).send()
    },
  )

  app.get('/metrics',{ preHandler: [checkSessionIdExists] },async (request, reply) => {
      const totalRefeicaoOnDiet = await knex('meals')
        .where({ user_id: request.user?.id, isdiet: true })
        .count('id', { as: 'total' })
        .first()

      const totalRefeicaoOffDiet = await knex('meals')
        .where({ user_id: request.user?.id, isdiet: false })
        .count('id', { as: 'total' })
        .first()

      const totalRefeicao = await knex('meals')
        .where({ user_id: request.user?.id })
        .orderBy('date', 'desc')

      const { bestOnDietSequence } = totalRefeicao.reduce((reg, ref) => {
          if (ref.isdiet) {
            reg.currentSequence += 1
          } else {
            reg.currentSequence = 0
          }

          if (reg.currentSequence > reg.bestOnDietSequence) {
            reg.bestOnDietSequence = reg.currentSequence
          }
          return reg
        },
        { bestOnDietSequence: 0, currentSequence: 0 },
      )

      return reply.send({
        totalMeals: totalRefeicao.length,
        totalMealsOnDiet: totalRefeicaoOnDiet?.total,
        totalMealsOffDiet: totalRefeicaoOffDiet?.total,
        bestOnDietSequence,
      })
    },
  )
}