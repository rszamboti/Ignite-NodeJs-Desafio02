import { FastifyInstance } from "fastify";
import crypto from "node:crypto";
import { z } from "zod";
import { knex } from "../database";

export async function userRoutes(app: FastifyInstance) {
    app.post("/", async (request, reply) => {
        const createUserBody = z.object({
            name: z.string(),
            email: z.string(),
        });

        let sessionId = request.cookies.sessionId;

        if(!sessionId) {
            sessionId = crypto.randomUUID();
            reply.cookie("sessionId", sessionId, {
                path: "/",
                maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
            });
        }
        console.log(sessionId);

        const { name, email } = createUserBody.parse(request.body);
        const userPorEmail = await knex("users").where("email", email).first();
        
        if(userPorEmail) {
            return reply.status(409).send({ message: "User already exists" });

        }
        await knex("users").insert({
            id: crypto.randomUUID(),
            name,
            email,
            session_id : sessionId
        })

        return reply.status(201).send();
    });

    

}