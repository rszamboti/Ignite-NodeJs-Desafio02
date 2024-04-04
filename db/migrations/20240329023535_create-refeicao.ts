import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('meals', (table) => {
        table.uuid('id').primary()
        table.uuid('user_id').references('users.id').notNullable()
        table.string('name').notNullable()
        table.string('description').notNullable()
        table.boolean('isdiet').notNullable()
        table.date('date').notNullable()
        table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable()
        table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable()
      })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('meals')
}

