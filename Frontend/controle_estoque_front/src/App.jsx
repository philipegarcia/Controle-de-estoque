import { useEffect, useState, useRef } from 'react'
import './App.css'
import Plus from '../src/assets/mais.png'
import Minus from '../src/assets/menos.png'
import Trash from '../src/assets/trash.svg'
import Edit from '../src/assets/edit.png'
import api from '../src/services/api'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);


function App() {
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState("")

  const inputName = useRef()
  const inputAmount = useRef()
  const inputMinAmount = useRef()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [editName, setEditName] = useState("")
  const [editMinAmount, setEditMinAmount] = useState("")

  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false); // Para controlar a exibição do modal do gráfico

  const handleUpdateAmount = async (product, action) => {
    const input = prompt(`Digite a quantidade para ${action === "add" ? "adicionar" : "retirar"}:`)

    const quantidade = parseInt(input, 10)
    if (isNaN(quantidade) || quantidade <= 0) {
      alert("Digite uma quantidade válida.")
      return
    }

    let novaQuantidade = action === "add"
      ? product.amount + quantidade
      : product.amount - quantidade

    if (novaQuantidade < 0) {
      alert("A quantidade em estoque não pode ser negativa.")
      return
    }

    const updatedProduct = {
      ...product,
      amount: novaQuantidade
    }

    try {
      await fetch(`http://localhost:3000/produtos/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProduct)
      })

      window.location.reload()
    } catch (error) {
      alert("Erro ao atualizar produto")
      console.error(error)
    }
  }

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

  const openEditModal = (product) => {
    setSelectedProduct(product)
    setEditName(product.name)
    setEditMinAmount(product.min_amount)
    setIsModalOpen(true)
  }

  const handleEditProduct = async () => {
    const updatedProduct = {
      ...selectedProduct,
      name: editName,
      min_amount: parseInt(editMinAmount)
    }

    try {
      await fetch(`http://localhost:3000/produtos/${selectedProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProduct)
      })

      setIsModalOpen(false)
      setSelectedProduct(null)
      getProducts()
    } catch (error) {
      alert("Erro ao atualizar produto")
      console.error(error)
    }
  }

  useEffect(() => {
    getProducts()
  }, [])

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const exportToPDF = () => {
    const doc = new jsPDF()
    const now = new Date()
    const dataHora = now.toLocaleString()

    doc.text("Relatório de Produtos", 14, 16)
    doc.setFontSize(10)
    doc.text(`Gerado em: ${dataHora}`, 14, 22)

    const tableColumn = ["Nome", "Quantidade em estoque", "Estoque mínimo"]
    const tableRows = []

    products.forEach(product => {
      const rowData = [product.name, product.amount, product.min_amount]
      tableRows.push(rowData)
    })

    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 28 })
    doc.save("produtos.pdf")
  }

  const gerarListaDeCompras = () => {
    const doc = new jsPDF()
    const now = new Date()
    const dataHora = now.toLocaleString()

    doc.text("Lista de Compras", 14, 16)
    doc.setFontSize(10)
    doc.text(`Gerado em: ${dataHora}`, 14, 22)

    const tableColumn = ["Nome", "Estoque Atual", "Precisa comprar"]
    const tableRows = []

    products.forEach(product => {
      if (product.amount < product.min_amount) {
        const faltando = product.min_amount - product.amount
        tableRows.push([
          product.name,
          faltando,
          product.amount,
          product.min_amount
        ])
      }
    })

    if (tableRows.length === 0) {
      doc.text("Nenhum produto abaixo do estoque mínimo.", 14, 32)
    } else {
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 28
      })
    }

    doc.save("lista_de_compras.pdf")
  }

  const chartData = {
    labels: products.map(product => product.name),
    datasets: [{
      label: 'Quantidade em Estoque',
      data: products.map(product => product.amount),
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  };

  return (
    <div>
      <div className='cadastro'>
        <form>
          <h1>Cadastro de produtos</h1>
          <input placeholder='Nome' type='text' ref={inputName} />
          <input placeholder='Quantidade em estoque' type='number' ref={inputAmount} />
          <input placeholder='Estoque mínimo' type='number' ref={inputMinAmount} />
          <button type='button' onClick={createProducts}>Adicionar</button>
        </form>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
        margin: '20px',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Buscar produto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10px',
            width: '250px',
            borderRadius: '5px',
            border: '1px solid #ccc',
            fontSize: '16px'
          }}
        />
        <button onClick={exportToPDF} style={{
          padding: '10px 20px',
          backgroundColor: '#444',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}>
          Exportar para PDF
        </button>
        <button onClick={gerarListaDeCompras} style={{
          padding: '10px 20px',
          backgroundColor: '#1e88e5',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}>
          Gerar lista de compras
        </button>
        <button onClick={() => setIsGraphModalOpen(true)} style={{
          padding: '10px 20px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}>
          Gerar gráfico
        </button>
      </div>

      <div className='container'>
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
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
                  <img src={Trash} alt="Deletar" />
                </button>
                <button onClick={() => handleUpdateAmount(product, "add")}>
                  <img src={Plus} alt="Adicionar" />
                </button>
                <button onClick={() => handleUpdateAmount(product, "remove")}>
                  <img src={Minus} alt="Remover" />
                </button>
                <button onClick={() => openEditModal(product)}>
                  <img src={Edit} alt="Editar" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p style={{
            textAlign: "center",
            width: "100%",
            fontSize: "18px",
            color: "#fff",
            fontWeight: "bold",
            marginTop: "30px"
          }}>
            🕵️‍♂️ Nenhum produto encontrado.
          </p>
        )}
      </div>

      {/* Modal de edição */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Editar Produto</h2>
            <label htmlFor="editName">Nome do Produto:</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nome do produto"
            />
            <label htmlFor="editName">Estoque mínimo:</label>
            <input
              type="number"
              value={editMinAmount}
              onChange={(e) => setEditMinAmount(e.target.value)}
              placeholder="Estoque Mínimo"
            />
            <div style={{ marginTop: "20px" }}>
              <button onClick={handleEditProduct}>Salvar</button>
              <button onClick={() => setIsModalOpen(false)} style={{ marginLeft: "10px" }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
       {/* Modal do gráfico */}
       {isGraphModalOpen && (
        <div className="modal" style={{ width: '70vw', height: '50vh'}} align>
          <div className="modal-content">
            <h2>Gráfico de Estoque</h2>
            <Bar data={chartData} options={{
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: 'Quantidade de Produtos em Estoque'
                },
                legend: {
                  position: 'top',
                },
              },
              scales: {
                x: {
                  beginAtZero: true
                },
                y: {
                  beginAtZero: true
                }
              }
            }} />
            <button onClick={() => setIsGraphModalOpen(false)} style={{ marginTop: '20px' }}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
