import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('users', (table) => {
        table.uuid('id').primary()
        table.string('session_id').notNullable().unique()
        table.string('name').notNullable()
        table.string('email').notNullable().unique()
        table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable()
        table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable()
      })
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('users')
}

