import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { initializeDatabase, insertReading, listReadings, type Reading } from './data/readings';

function horarioBrasilia(data: string) {
  return new Date(data).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

function TelaPrincipal() {
  const banco = useSQLiteContext();
  const [leituras, setLeituras] = useState<Reading[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [simulando, setSimulando] = useState(false);
  const [corrente, setCorrente] = useState('');
  const [tensao, setTensao] = useState('');
  const [potencia, setPotencia] = useState('');
  const [temperatura, setTemperatura] = useState('');

  async function carregarLeituras() {
    try {
      setLeituras(await listReadings(banco));
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar as leituras.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarLeituras();
  }, [banco]);

  useEffect(() => {
    if (!simulando) return;

    let ativo = true;

    async function gerarLeitura() {
      const correnteSimulada = Number((14 + Math.random() * 4).toFixed(1));
      const tensaoSimulada = Number((218 + Math.random() * 4).toFixed(1));
      const temperaturaSimulada = Number((29 + Math.random() * 6).toFixed(1));

      try {
        await insertReading(banco, {
          currentA: correnteSimulada,
          voltageV: tensaoSimulada,
          activePowerW: Math.round(correnteSimulada * tensaoSimulada * 0.95),
          panelTempC: temperaturaSimulada,
        }, 'demo');
        if (ativo) await carregarLeituras();
      } catch {
        if (ativo) {
          setSimulando(false);
          Alert.alert('Erro', 'A simulação foi interrompida.');
        }
      }
    }

    gerarLeitura();
    const intervalo = setInterval(gerarLeitura, 5000);
    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [simulando, banco]);

  async function salvarLeitura() {
    if (!corrente.trim() || !tensao.trim() || !potencia.trim() || !temperatura.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }

    try {
      // Aceita vírgula ou ponto como separador decimal.
      await insertReading(banco, {
        currentA: Number(corrente.replace(',', '.')),
        voltageV: Number(tensao.replace(',', '.')),
        activePowerW: Number(potencia.replace(',', '.')),
        panelTempC: Number(temperatura.replace(',', '.')),
      });
      setCorrente('');
      setTensao('');
      setPotencia('');
      setTemperatura('');
      setMostrarFormulario(false);
      await carregarLeituras();
    } catch (erro) {
      Alert.alert('Erro', erro instanceof Error ? erro.message : 'Não foi possível salvar.');
    }
  }

  const ultima = leituras[0];

  return (
    <View style={styles.tela}>
      <StatusBar barStyle="dark-content" backgroundColor="#f2f5f9" />
      <ScrollView
        style={styles.rolagem}
        contentContainerStyle={styles.conteudo}
        scrollEnabled
        showsVerticalScrollIndicator
        persistentScrollbar
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.titulo}>ChargeSense</Text>
        <Text style={styles.subtitulo}>Monitoramento da estação de recarga</Text>

        <Text style={styles.secao}>Última leitura</Text>
        {carregando && <ActivityIndicator />}
        {!carregando && !ultima && <Text>Nenhuma leitura encontrada.</Text>}

        {ultima && (
          <View>
            <Text style={styles.data}>{horarioBrasilia(ultima.measuredAt)} (horário de Brasília)</Text>
            <View style={styles.linha}>
              <View style={styles.cartao}>
                <Text style={styles.rotulo}>Corrente</Text>
                <Text style={styles.valor}>{ultima.currentA.toFixed(1)} A</Text>
              </View>
              <View style={styles.cartao}>
                <Text style={styles.rotulo}>Tensão</Text>
                <Text style={styles.valor}>{ultima.voltageV.toFixed(1)} V</Text>
              </View>
            </View>
            <View style={styles.linha}>
              <View style={styles.cartao}>
                <Text style={styles.rotulo}>Potência</Text>
                <Text style={styles.valor}>{ultima.activePowerW.toFixed(0)} W</Text>
              </View>
              <View style={styles.cartao}>
                <Text style={styles.rotulo}>Temperatura</Text>
                <Text style={styles.valor}>{ultima.panelTempC.toFixed(1)} °C</Text>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.aviso}>Dados de demonstração ou inseridos manualmente. Ainda não há sensores conectados.</Text>
        <Pressable style={[styles.botao, styles.botaoSimulacao]} onPress={() => setSimulando(!simulando)}>
          <Text style={styles.textoBotao}>{simulando ? 'Parar simulação' : 'Simulação'}</Text>
        </Pressable>
        <Text style={styles.textoSimulacao}>
          {simulando ? 'Simulação ativa: uma leitura nova a cada 5 segundos.' : 'Toque para gerar leituras automaticamente.'}
        </Text>
        <Pressable style={styles.botao} onPress={() => setMostrarFormulario(!mostrarFormulario)}>
          <Text style={styles.textoBotao}>{mostrarFormulario ? 'Cancelar' : 'Adicionar leitura'}</Text>
        </Pressable>

        {mostrarFormulario && (
          <View>
            <Text style={styles.secao}>Nova leitura</Text>
            <Text>Corrente (A)</Text>
            <TextInput style={styles.campo} value={corrente} onChangeText={setCorrente} keyboardType="decimal-pad" placeholder="Ex.: 15,2" />
            <Text>Tensão (V)</Text>
            <TextInput style={styles.campo} value={tensao} onChangeText={setTensao} keyboardType="decimal-pad" placeholder="Ex.: 220" />
            <Text>Potência ativa (W)</Text>
            <TextInput style={styles.campo} value={potencia} onChangeText={setPotencia} keyboardType="decimal-pad" placeholder="Ex.: 3200" />
            <Text>Temperatura (°C)</Text>
            <TextInput style={styles.campo} value={temperatura} onChangeText={setTemperatura} keyboardType="decimal-pad" placeholder="Ex.: 31,5" />
            <Pressable style={styles.botao} onPress={salvarLeitura}>
              <Text style={styles.textoBotao}>Salvar</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.secao}>Histórico</Text>
        {leituras.slice(0, 8).map((leitura) => (
          <View key={leitura.id} style={styles.itemHistorico}>
            <Text style={styles.hora}>{horarioBrasilia(leitura.measuredAt)} · {leitura.source === 'demo' ? 'Exemplo/simulação' : 'Manual'}</Text>
            <Text>{leitura.currentA.toFixed(1)} A  •  {leitura.voltageV.toFixed(1)} V</Text>
            <Text>{leitura.activePowerW.toFixed(0)} W  •  {leitura.panelTempC.toFixed(1)} °C</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export default function App() {
  return (
    <SQLiteProvider databaseName="chargesense.db" onInit={initializeDatabase}>
      <TelaPrincipal />
    </SQLiteProvider>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#f2f5f9', paddingTop: StatusBar.currentHeight ?? 0 },
  rolagem: { flex: 1 },
  conteudo: { padding: 20, paddingBottom: 40 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#17345c' },
  subtitulo: { color: '#5d6b7a', marginBottom: 20 },
  secao: { fontSize: 19, fontWeight: 'bold', marginTop: 20, marginBottom: 12, color: '#17345c' },
  data: { color: '#5d6b7a', marginBottom: 10 },
  linha: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  cartao: { flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 10, elevation: 2 },
  rotulo: { color: '#5d6b7a', marginBottom: 8 },
  valor: { fontSize: 20, fontWeight: 'bold', color: '#17345c' },
  aviso: { backgroundColor: '#e4edf8', padding: 12, borderRadius: 8, marginTop: 12, color: '#34495e' },
  botao: { backgroundColor: '#245caa', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 18 },
  botaoSimulacao: { backgroundColor: '#187657' },
  textoBotao: { color: 'white', fontWeight: 'bold' },
  textoSimulacao: { color: '#5d6b7a', marginTop: 8, textAlign: 'center' },
  campo: { backgroundColor: 'white', borderWidth: 1, borderColor: '#c5cdd5', borderRadius: 7, padding: 11, marginTop: 5, marginBottom: 12 },
  itemHistorico: { backgroundColor: 'white', padding: 14, borderRadius: 8, marginBottom: 10 },
  hora: { fontWeight: 'bold', marginBottom: 5 },
});
