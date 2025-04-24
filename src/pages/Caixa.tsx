import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { formatCurrency } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface CaixaRegistro {
  id: string
  valor_inicial: number
  valor_final: number | null
  observacao: string | null
  data_abertura: string
  data_fechamento: string | null
  status: 'aberto' | 'fechado'
}

export default function Caixa() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [savingOpen, setSavingOpen] = useState(false)
  const [savingClose, setSavingClose] = useState(false)
  const [caixaAtual, setCaixaAtual] = useState<CaixaRegistro | null>(null)
  const [valorInicial, setValorInicial] = useState('')
  const [valorFinal, setValorFinal] = useState('')
  const [observacao, setObservacao] = useState('')

  useEffect(() => {
    if (user) {
      loadCaixaAtual()
    }
  }, [user])

  async function loadCaixaAtual() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('vw_caixa')
        .select('id, valor_inicial, valor_final, observacao, data_abertura, data_fechamento, status')
        .eq('empresa_id', user.empresa_id)
        .eq('status', 'aberto')
        .single()

      if (error) throw error

      setCaixaAtual(data)
    } catch (error: any) {
      console.error('Erro ao carregar caixa:', error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAbrirCaixa() {
    try {
      if (!valorInicial || isNaN(parseFloat(valorInicial))) {
        toast({
          title: 'Erro',
          description: 'Informe um valor inicial válido',
          variant: 'destructive'
        })
        return
      }

      setSavingOpen(true)
      const { error } = await supabase
        .from('caixa')
        .insert({
          empresa_id: user.empresa_id,
          usuario_id: user.id,
          valor_inicial: parseFloat(valorInicial),
          status: 'aberto'
        })

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Caixa aberto com sucesso!'
      })

      setValorInicial('')
      loadCaixaAtual()
    } catch (error: any) {
      console.error('Erro ao abrir caixa:', error.message)
      toast({
        title: 'Erro',
        description: 'Erro ao abrir caixa. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setSavingOpen(false)
    }
  }

  async function handleFecharCaixa() {
    try {
      if (!valorFinal || isNaN(parseFloat(valorFinal))) {
        toast({
          title: 'Erro',
          description: 'Informe um valor final válido',
          variant: 'destructive'
        })
        return
      }

      setSavingClose(true)
      const { error } = await supabase
        .from('caixa')
        .update({
          valor_final: parseFloat(valorFinal),
          observacao,
          data_fechamento: new Date().toISOString(),
          status: 'fechado'
        })
        .eq('id', caixaAtual?.id)

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Caixa fechado com sucesso!'
      })

      setValorFinal('')
      setObservacao('')
      loadCaixaAtual()
    } catch (error: any) {
      console.error('Erro ao fechar caixa:', error.message)
      toast({
        title: 'Erro',
        description: 'Erro ao fechar caixa. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setSavingClose(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (caixaAtual) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Fechar Caixa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Valor Inicial</Label>
            <div className="text-lg font-medium">
              {formatCurrency(caixaAtual.valor_inicial)}
            </div>
          </div>

          <div>
            <Label htmlFor="valorFinal">Valor Final</Label>
            <Input
              id="valorFinal"
              type="number"
              step="0.01"
              value={valorFinal}
              onChange={(e) => setValorFinal(e.target.value)}
              placeholder="0,00"
            />
          </div>

          <div>
            <Label htmlFor="observacao">Observação</Label>
            <Textarea
              id="observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Observações sobre o fechamento..."
            />
          </div>

          <Button 
            onClick={handleFecharCaixa} 
            disabled={savingClose}
            className="w-full"
          >
            {savingClose ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Fechar Caixa'
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Abrir Caixa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="valorInicial">Valor Inicial</Label>
          <Input
            id="valorInicial"
            type="number"
            step="0.01"
            value={valorInicial}
            onChange={(e) => setValorInicial(e.target.value)}
            placeholder="0,00"
          />
        </div>

        <Button 
          onClick={handleAbrirCaixa} 
          disabled={savingOpen}
          className="w-full"
        >
          {savingOpen ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Abrir Caixa'
          )}
        </Button>
      </CardContent>
    </Card>
  )
} 