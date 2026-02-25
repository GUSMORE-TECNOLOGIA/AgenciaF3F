import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { ModalProvider } from './contexts/ModalContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { ModuleGuard } from './components/auth/ModuleGuard'
import Login from './pages/auth/Login'
import ResetPassword from './pages/auth/ResetPassword'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/clientes/Clientes'
import ClienteNovo from './pages/clientes/ClienteNovo'
import ClienteEdit from './pages/clientes/ClienteEdit'
import Servicos from './pages/servicos/Servicos'
import ServicoNovo from './pages/servicos/ServicoNovo'
import ServicoEdit from './pages/servicos/ServicoEdit'
import Planos from './pages/planos/Planos'
import PlanoNovo from './pages/planos/PlanoNovo'
import PlanoEdit from './pages/planos/PlanoEdit'
import PlanoDetail from './pages/planos/PlanoDetail'
import Financeiro from './pages/financeiro/Financeiro'
import TransacaoNovo from './pages/financeiro/TransacaoNovo'
import TransacaoEdit from './pages/financeiro/TransacaoEdit'
import Ocorrencias from './pages/ocorrencias/Ocorrencias'
import OcorrenciaNovo from './pages/ocorrencias/OcorrenciaNovo'
import OcorrenciaEdit from './pages/ocorrencias/OcorrenciaEdit'
import Atendimento from './pages/atendimento/Atendimento'
import AtendimentoNovo from './pages/atendimento/AtendimentoNovo'
import AtendimentoEdit from './pages/atendimento/AtendimentoEdit'
import Equipe from './pages/configuracoes/Equipe'
import Layout from './components/layout/Layout'

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <ModalProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="alterar-senha" element={<ResetPassword />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="clientes/novo" element={<ClienteNovo />} />
            <Route path="clientes/:id/editar" element={<ClienteEdit />} />
            <Route path="clientes/:id" element={<ClienteEdit />} />
            <Route path="servicos" element={<Servicos />} />
            <Route path="servicos/novo" element={<ServicoNovo />} />
            <Route path="servicos/:id/editar" element={<ServicoEdit />} />
            <Route path="planos" element={<Planos />} />
            <Route path="planos/novo" element={<PlanoNovo />} />
            <Route path="planos/:id/editar" element={<PlanoEdit />} />
            <Route path="planos/:id" element={<PlanoDetail />} />
            <Route
              path="financeiro"
              element={
                <ModuleGuard modulo="financeiro" acao="visualizar">
                  <Financeiro />
                </ModuleGuard>
              }
            />
            <Route
              path="financeiro/nova"
              element={
                <ModuleGuard modulo="financeiro" acao="visualizar">
                  <TransacaoNovo />
                </ModuleGuard>
              }
            />
            <Route
              path="financeiro/:id/editar"
              element={
                <ModuleGuard modulo="financeiro" acao="visualizar">
                  <TransacaoEdit />
                </ModuleGuard>
              }
            />
            <Route path="ocorrencias" element={<Ocorrencias />} />
            <Route path="ocorrencias/nova" element={<OcorrenciaNovo />} />
            <Route path="ocorrencias/:id/editar" element={<OcorrenciaEdit />} />
            <Route path="atendimento" element={<Atendimento />} />
            <Route path="atendimento/novo" element={<AtendimentoNovo />} />
            <Route path="atendimento/:id/editar" element={<AtendimentoEdit />} />
            <Route path="configuracoes/equipe" element={<Equipe />} />
          </Route>
          </Routes>
        </ModalProvider>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
