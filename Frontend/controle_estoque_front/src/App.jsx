import { useEffect, useState, useRef } from 'react'
import './App.css'
import Plus from '../src/assets/mais.png'
import Minus from '../src/assets/menos.png'
import Trash from '../src/assets/trash.svg'
import api from '../src/services/api'

function App() {
  const [products, setProducts] = useState([])

  const inputName = useRef()
  const inputAmount = useRef()
  const inputMinAmount = useRef()

  const handleUpdateAmount = async (product, action) => {
    const input = prompt(`Digite a quantidade para ${action === "add" ? "adicionar" : "retirar"}:`);
  
    const quantidade = parseInt(input, 10);
    if (isNaN(quantidade) || quantidade <= 0) {
      alert("Digite uma quantidade válida.");
      return;
    }
  
    let novaQuantidade = action === "add"
      ? product.amount + quantidade
      : product.amount - quantidade;
  
    if (novaQuantidade < 0) {
      alert("A quantidade em estoque não pode ser negativa.");
      return;
    }
  
    const updatedProduct = {
      ...product,
      amount: novaQuantidade
    };
  
    try {
      await fetch(`http://localhost:3000/produtos/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedProduct)
      });
  
      // Atualizar a lista de produtos na tela
      // Pode ser via reload ou atualizando o estado, depende de como está sua lógica
      // Aqui está um exemplo básico com reload da lista:
      window.location.reload(); // ou chame uma função tipo fetchProducts()
  
    } catch (error) {
      alert("Erro ao atualizar produto");
      console.error(error);
    }
  };

  async function getProducts() {
    const productsFromApi = await api.get('/produtos')

    setProducts(productsFromApi.data)
  }

  async function deleteProducts(id) {
    await api.delete(`/produtos/${id}`)

    getProducts()
  }

  async function createProducts() {
    await api.post('/produtos', {
      name: inputName.current.value,
      amount: parseInt(inputAmount.current.value),
      min_amount: parseInt(inputMinAmount.current.value)
    })

    getProducts()
  }

  useEffect(() => {
    getProducts()
  }, [])
  

  return (
    <div>
    <div className='cadastro'>
      <form>
        <h1>Cadastro de produtos</h1>
        <input placeholder='Nome' name='name' type='text' ref={inputName}/>
        <input placeholder='Quantidade em estoque' name='amount' type='number' ref={inputAmount}/>
        <input placeholder='Estoque mínimo' name='min_amount' type='number' ref={inputMinAmount}/>
        <button type='button' onClick={createProducts}>Adicionar</button>
      </form>
    </div>
    
    <div className='container'>
      {products.map(product => (
        <div
        key={product.id}
        className={`card ${product.amount <= product.min_amount ? "alerta" : ""}`}
      >
          <div>
            <p>Nome: <span>{product.name}</span></p>
            <p>Quantidade em estoque: <span>{product.amount}</span></p>
            <p>Estoque mínimo: <span>{product.min_amount}</span></p>
          </div>
          <div>
          <button onClick={() => deleteProducts(product.id)}>
            <img src={Trash} />
          </button>
          <button onClick={() => handleUpdateAmount(product, "add")}>
            <img src={Plus} />
        </button>
        <button onClick={() => handleUpdateAmount(product, "remove")}>
            <img src={Minus} />
        </button>
          </div>
        </div>
      ))}
    </div>
      </div>

    


  )
}

export default App
