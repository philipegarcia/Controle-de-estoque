import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const app = express()
app.use(express.json())
app.use(cors())


//Método para adicionar produtos
app.post('/produtos', async (req, res) => {

    await prisma.product.create({
        data: {
            name: req.body.name,
            amount: req.body.amount,
            min_amount: req.body.min_amount
        }

    })

    res.status(201).json(req.body)

})

//Método para listar produto
app.get('/produtos', async (req, res) => {
    let products = []

    if (req.query) {
        products = await prisma.product.findMany({
            where: {
                name: req.query.name
            }
        })
   
    }
    else {
        products = await prisma.product.findMany()
    }

    res.status(200).json(products)

})

//Método para editar produtos
app.put('/produtos/:id', async (req, res) => {

    await prisma.product.update({
        where: {
            id: req.params.id
        },
        data: {
            name: req.body.name,
            amount: req.body.amount,
            min_amount: req.body.min_amount
        }

    })

    res.status(201).json(req.body)

})

//Método para excluir produtos
app.delete('/produtos/:id', async (req, res) => {

    await prisma.product.delete({
        where: {
            id: req.params.id
        }
    })

    res.status(200).json({ message: "Produto excluído com sucesso!" })
})

//Porta em que é acionado o backend
app.listen(3000)