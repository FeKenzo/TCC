import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { initializeDatabase, insertReading, listReadings, type Reading } from './data/readings';

type Aba = 'dashboard' | 'historico' | 'entrada';

function horarioBrasilia(data: string) {
  return new Date(data).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatarNumero(valor: number, casas = 1) {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

function CartaoMetrica({ titulo, valor, unidade, detalhe, cor = '#17345c' }: {
  titulo: string; valor: string; unidade: string; detalhe: string; cor?: string;
}) {
  return (
    <View style={styles.cartaoMetrica}>
      <Text style={styles.rotuloMetrica}>{titulo}</Text>
      <View style={styles.valorLinha}>
        <Text style={[styles.valorMetrica, { color: cor }]}>{valor}</Text>
        <Text style={styles.unidadeMetrica}>{unidade}</Text>
      </View>
      <Text style={styles.detalheMetrica}>{detalhe}</Text>
    </View>
  );
}

function GraficoPotencia({ leituras }: { leituras: Reading[] }) {
  const pontos = [...leituras].slice(0, 8).reverse();
  const maximo = Math.max(1, ...pontos.map((item) => item.activePowerW));

  if (pontos.length === 0) {
    return <Text style={styles.textoVazio}>Ainda não existem dados para montar o gráfico.</Text>;
  }

  return (
    <View style={styles.grafico}>
      <View style={styles.barras}>
        {pontos.map((item, index) => {
          const altura = Math.max(8, (item.activePowerW / maximo) * 112);
          return (
            <View key={item.id} style={styles.colunaGrafico}>
              <Text style={styles.valorBarra}>{(item.activePowerW / 1000).toFixed(1)}</Text>
              <View style={styles.trilhoBarra}>
                <View style={[styles.barra, { height: altura }]} />
              </View>
              <Text style={styles.rotuloBarra}>{index + 1}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.legendaGrafico}>
        <View style={styles.bolinhaAzul} />
        <Text style={styles.textoLegenda}>Potência ativa (kW) · últimas {pontos.length} leituras</Text>
      </View>
    </View>
  );
}

function TelaPrincipal() {
  const banco = useSQLiteContext();
  const [leituras, setLeituras] = useState<Reading[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState<Aba>('dashboard');
  const [simulando, setSimulando] = useState(false);
  const [corrente, setCorrente] = useState('');
  const [tensao, setTensao] = useState('');
  const [potencia, setPotencia] = useState('');
  const [temperatura, setTemperatura] = useState('');

  async function carregarLeituras() {
    try {
      setLeituras(await listReadings(banco, 100));
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
    const valores = [corrente, tensao, potencia, temperatura];
    if (valores.some((valor) => !valor.trim())) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    const numeros = valores.map((valor) => Number(valor.replace(',', '.')));
    if (numeros.some((valor) => !Number.isFinite(valor))) {
      Alert.alert('Atenção', 'Informe valores numéricos válidos.');
      return;
    }
    try {
      await insertReading(banco, {
        currentA: numeros[0],
        voltageV: numeros[1],
        activePowerW: numeros[2],
        panelTempC: numeros[3],
      });
      setCorrente(''); setTensao(''); setPotencia(''); setTemperatura('');
      setAba('dashboard');
      await carregarLeituras();
      Alert.alert('Leitura salva', 'Os dados foram registrados no histórico.');
    } catch (erro) {
      Alert.alert('Erro', erro instanceof Error ? erro.message : 'Não foi possível salvar.');
    }
  }

  const ultima = leituras[0];
  const leiturasDemo = leituras.filter((item) => item.source === 'demo').length;
  const ultimaAtualizacao = ultima ? horarioBrasilia(ultima.measuredAt) : 'Sem dados';
  const potenciaMedia = useMemo(() => {
    const amostra = leituras.slice(0, 8);
    return amostra.length ? amostra.reduce((soma, item) => soma + item.activePowerW, 0) / amostra.length : 0;
  }, [leituras]);

  return (
    <View style={styles.tela}>
      <StatusBar barStyle="light-content" backgroundColor="#10243b" />
      <View style={styles.cabecalho}>
        <View style={styles.cabecalhoTopo}>
          <View>
            <Text style={styles.marca}>ChargeSense</Text>
            <Text style={styles.subtituloCabecalho}>MONITORAMENTO DE RECARGA</Text>
          </View>
          <View style={[styles.statusPill, simulando ? styles.statusDemo : styles.statusLocal]}>
            <View style={styles.statusPonto} />
            <Text style={styles.statusTexto}>{simulando ? 'DEMO ATIVA' : 'LOCAL'}</Text>
          </View>
        </View>
        <View style={styles.estacaoLinha}>
          <View>
            <Text style={styles.nomeEstacao}>Estação Bancada 01</Text>
            <Text style={styles.idEstacao}>ID: bancada-01</Text>
          </View>
          <Text style={styles.ultimaAtualizacao}>Atualizado: {ultima ? horarioBrasilia(ultima.measuredAt).split(' ')[1] : '--:--:--'}</Text>
        </View>
      </View>

      <View style={styles.navegacao}>
        {([
          ['dashboard', 'Visão geral'],
          ['historico', 'Histórico'],
          ['entrada', 'Inserir dados'],
        ] as [Aba, string][]).map(([id, titulo]) => (
          <Pressable key={id} onPress={() => setAba(id)} style={[styles.aba, aba === id && styles.abaAtiva]}>
            <Text style={[styles.textoAba, aba === id && styles.textoAbaAtiva]}>{titulo}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.rolagem}
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {carregando ? <ActivityIndicator size="large" color="#245caa" style={styles.carregando} /> : null}

        {aba === 'dashboard' && (
          <>
            <View style={styles.tituloSecaoLinha}>
              <View>
                <Text style={styles.tituloSecao}>Visão geral</Text>
                <Text style={styles.descricaoSecao}>Acompanhamento da estação em tempo real (simulado).</Text>
              </View>
              <View style={styles.indicadorOnline}><View style={styles.bolinhaVerde} /><Text style={styles.textoOnline}>DADOS LOCAIS</Text></View>
            </View>

            {ultima ? (
              <>
                <View style={styles.cartoesGrade}>
                  <CartaoMetrica titulo="Corrente" valor={formatarNumero(ultima.currentA)} unidade="A" detalhe="Corrente elétrica" />
                  <CartaoMetrica titulo="Tensão" valor={formatarNumero(ultima.voltageV)} unidade="V" detalhe="Tensão medida" />
                  <CartaoMetrica titulo="Potência ativa" valor={formatarNumero(ultima.activePowerW / 1000, 2)} unidade="kW" detalhe="Demanda instantânea" />
                  <CartaoMetrica titulo="Temperatura" valor={formatarNumero(ultima.panelTempC)} unidade="°C" detalhe="Quadro elétrico" cor="#b66a19" />
                </View>

                <View style={styles.cartaoPainel}>
                  <View style={styles.cabecalhoCartao}>
                    <Text style={styles.tituloCartao}>Potência ao longo das leituras</Text>
                    <Text style={styles.unidadeCartao}>kW</Text>
                  </View>
                  <GraficoPotencia leituras={leituras} />
                </View>

                <View style={styles.duasColunas}>
                  <View style={styles.cartaoResumo}>
                    <Text style={styles.rotuloResumo}>Potência média*</Text>
                    <Text style={styles.valorResumo}>{formatarNumero(potenciaMedia / 1000, 2)} kW</Text>
                    <Text style={styles.detalheResumo}>Últimas {Math.min(8, leituras.length)} leituras</Text>
                  </View>
                  <View style={styles.cartaoResumo}>
                    <Text style={styles.rotuloResumo}>Registros salvos</Text>
                    <Text style={styles.valorResumo}>{leituras.length}</Text>
                    <Text style={styles.detalheResumo}>{leiturasDemo} de demonstração</Text>
                  </View>
                </View>
                <Text style={styles.notaTecnica}>* Média aritmética das últimas leituras disponíveis. Não representa energia acumulada (kWh).</Text>

                <View style={styles.cartaoPainel}>
                  <Text style={styles.tituloCartao}>Estado do monitoramento</Text>
                  <View style={styles.estadoLinha}>
                    <View style={[styles.estadoIcone, { backgroundColor: '#e8f5ee' }]}><Text style={styles.iconeCheck}>✓</Text></View>
                    <View style={styles.estadoTextoBloco}>
                      <Text style={styles.estadoTitulo}>Coleta de dados disponível</Text>
                      <Text style={styles.estadoDescricao}>{simulando ? 'Novas leituras são geradas a cada 5 segundos.' : 'Aguardando acionamento da simulação ou inserção manual.'}</Text>
                    </View>
                  </View>
                  <View style={styles.separador} />
                  <View style={styles.estadoLinha}>
                    <View style={[styles.estadoIcone, { backgroundColor: '#fff4e5' }]}><Text style={styles.iconeInfo}>i</Text></View>
                    <View style={styles.estadoTextoBloco}>
                      <Text style={styles.estadoTitulo}>Alertas ainda não configurados</Text>
                      <Text style={styles.estadoDescricao}>Os limites de atenção e criticidade precisam ser definidos e validados.</Text>
                    </View>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.cartaoVazio}><Text style={styles.textoVazio}>Nenhuma leitura disponível. Inicie a simulação ou insira os dados manualmente.</Text></View>
            )}

            <View style={styles.cartaoAcoes}>
              <Text style={styles.tituloCartao}>Controle da demonstração</Text>
              <Text style={styles.descricaoAcao}>Gere dados fictícios para testar os indicadores e o gráfico do dashboard.</Text>
              <Pressable style={[styles.botao, simulando ? styles.botaoParar : styles.botaoIniciar]} onPress={() => setSimulando(!simulando)}>
                <Text style={styles.textoBotao}>{simulando ? 'Parar simulação' : 'Iniciar simulação'}</Text>
              </Pressable>
              <Text style={styles.rodapeAcao}>Último registro: {ultimaAtualizacao} · horário de Brasília</Text>
            </View>
          </>
        )}

        {aba === 'historico' && (
          <>
            <Text style={styles.tituloSecao}>Histórico de medições</Text>
            <Text style={styles.descricaoSecao}>Registros armazenados localmente neste dispositivo.</Text>
            {leituras.length === 0 ? <View style={styles.cartaoVazio}><Text style={styles.textoVazio}>Nenhuma leitura registrada.</Text></View> : leituras.map((item) => (
              <View key={item.id} style={styles.itemHistorico}>
                <View style={styles.historicoTopo}>
                  <Text style={styles.horaHistorico}>{horarioBrasilia(item.measuredAt)}</Text>
                  <Text style={[styles.origemTag, item.source === 'demo' ? styles.origemDemo : styles.origemManual]}>{item.source === 'demo' ? 'SIMULAÇÃO' : 'MANUAL'}</Text>
                </View>
                <View style={styles.historicoValores}>
                  <Text style={styles.valorHistorico}>{formatarNumero(item.currentA)} A</Text>
                  <Text style={styles.valorHistorico}>{formatarNumero(item.voltageV)} V</Text>
                  <Text style={styles.valorHistorico}>{formatarNumero(item.activePowerW / 1000, 2)} kW</Text>
                  <Text style={styles.valorHistorico}>{formatarNumero(item.panelTempC)} °C</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {aba === 'entrada' && (
          <>
            <Text style={styles.tituloSecao}>Inserir leitura manual</Text>
            <Text style={styles.descricaoSecao}>Registre uma medição para visualizar os dados no dashboard e no histórico.</Text>
            <View style={styles.formulario}>
              <Text style={styles.rotuloCampo}>Corrente (A)</Text>
              <TextInput style={styles.campo} value={corrente} onChangeText={setCorrente} keyboardType="decimal-pad" placeholder="Ex.: 15,2" placeholderTextColor="#98a5b5" />
              <Text style={styles.rotuloCampo}>Tensão (V)</Text>
              <TextInput style={styles.campo} value={tensao} onChangeText={setTensao} keyboardType="decimal-pad" placeholder="Ex.: 220" placeholderTextColor="#98a5b5" />
              <Text style={styles.rotuloCampo}>Potência ativa (W)</Text>
              <TextInput style={styles.campo} value={potencia} onChangeText={setPotencia} keyboardType="decimal-pad" placeholder="Ex.: 3200" placeholderTextColor="#98a5b5" />
              <Text style={styles.rotuloCampo}>Temperatura do quadro (°C)</Text>
              <TextInput style={styles.campo} value={temperatura} onChangeText={setTemperatura} keyboardType="decimal-pad" placeholder="Ex.: 31,5" placeholderTextColor="#98a5b5" />
              <Pressable style={styles.botaoSalvar} onPress={salvarLeitura}><Text style={styles.textoBotao}>Salvar leitura</Text></Pressable>
            </View>
          </>
        )}

        <View style={styles.rodapeAviso}>
          <Text style={styles.textoAviso}>PROTÓTIPO ACADÊMICO</Text>
          <Text style={styles.descricaoAviso}>Os valores podem ser simulados ou inseridos manualmente. Ainda não há sensores físicos, conexão com carregador ou servidor. Este aplicativo não substitui dispositivos de proteção elétrica.</Text>
        </View>
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
  cabecalho: { backgroundColor: '#10243b', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 18 },
  cabecalhoTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  marca: { color: '#fff', fontSize: 27, fontWeight: '800', letterSpacing: 0.2 },
  subtituloCabecalho: { color: '#9fb4cb', fontSize: 10, letterSpacing: 1.5, marginTop: 3, fontWeight: '700' },
  statusPill: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7, gap: 6 },
  statusDemo: { backgroundColor: '#174c3b' },
  statusLocal: { backgroundColor: '#30445a' },
  statusPonto: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#55d69a' },
  statusTexto: { color: '#e8fff4', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  estacaoLinha: { marginTop: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#30445a', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nomeEstacao: { color: '#fff', fontSize: 15, fontWeight: '700' },
  idEstacao: { color: '#9fb4cb', fontSize: 11, marginTop: 3 },
  ultimaAtualizacao: { color: '#b8c8d8', fontSize: 10 },
  navegacao: { backgroundColor: '#fff', flexDirection: 'row', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#e1e7ef' },
  aba: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  abaAtiva: { borderBottomColor: '#2874c8' },
  textoAba: { color: '#718096', fontSize: 12, fontWeight: '600' },
  textoAbaAtiva: { color: '#17345c', fontWeight: '800' },
  rolagem: { flex: 1 },
  conteudo: { padding: 16, paddingBottom: 36 },
  carregando: { marginVertical: 14 },
  tituloSecaoLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  tituloSecao: { color: '#17345c', fontSize: 21, fontWeight: '800' },
  descricaoSecao: { color: '#718096', fontSize: 12, marginTop: 4, lineHeight: 18 },
  indicadorOnline: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#e8f5ee', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 20 },
  bolinhaVerde: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#219764' },
  textoOnline: { color: '#21734f', fontSize: 8, fontWeight: '800' },
  cartoesGrade: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cartaoMetrica: { width: '48%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, minHeight: 112, elevation: 1, shadowColor: '#10243b', shadowOpacity: 0.04, shadowRadius: 5 },
  rotuloMetrica: { color: '#718096', fontSize: 12, fontWeight: '600' },
  valorLinha: { flexDirection: 'row', alignItems: 'baseline', marginTop: 10 },
  valorMetrica: { fontSize: 25, fontWeight: '800', letterSpacing: -0.5 },
  unidadeMetrica: { color: '#718096', fontSize: 12, marginLeft: 5, fontWeight: '600' },
  detalheMetrica: { color: '#9aa7b5', fontSize: 10, marginTop: 6 },
  cartaoPainel: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 14, elevation: 1 },
  cabecalhoCartao: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tituloCartao: { color: '#17345c', fontSize: 14, fontWeight: '800' },
  unidadeCartao: { color: '#8795a5', fontSize: 11 },
  grafico: { marginTop: 18 },
  barras: { height: 154, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: '#e8edf3', paddingBottom: 3 },
  colunaGrafico: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  valorBarra: { color: '#718096', fontSize: 9, marginBottom: 5 },
  trilhoBarra: { height: 112, width: 18, justifyContent: 'flex-end', backgroundColor: '#f0f4f8', borderRadius: 5, overflow: 'hidden' },
  barra: { width: '100%', backgroundColor: '#3686d5', borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  rotuloBarra: { color: '#9aa7b5', fontSize: 9, marginTop: 5 },
  legendaGrafico: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 },
  bolinhaAzul: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#3686d5' },
  textoLegenda: { color: '#8795a5', fontSize: 10 },
  duasColunas: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cartaoResumo: { flex: 1, backgroundColor: '#fff', padding: 14, borderRadius: 12 },
  rotuloResumo: { color: '#718096', fontSize: 11 },
  valorResumo: { color: '#17345c', fontSize: 20, fontWeight: '800', marginTop: 7 },
  detalheResumo: { color: '#9aa7b5', fontSize: 10, marginTop: 4 },
  notaTecnica: { color: '#8996a5', fontSize: 10, lineHeight: 15, marginTop: 8, marginHorizontal: 2 },
  estadoLinha: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 14 },
  estadoIcone: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  iconeCheck: { color: '#218653', fontSize: 17, fontWeight: '800' },
  iconeInfo: { color: '#b66a19', fontSize: 15, fontWeight: '800' },
  estadoTextoBloco: { flex: 1 },
  estadoTitulo: { color: '#34465b', fontSize: 12, fontWeight: '700' },
  estadoDescricao: { color: '#8795a5', fontSize: 10, lineHeight: 15, marginTop: 3 },
  separador: { height: 1, backgroundColor: '#edf1f5', marginTop: 13 },
  cartaoAcoes: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 14 },
  descricaoAcao: { color: '#718096', fontSize: 11, lineHeight: 17, marginTop: 6 },
  botao: { padding: 14, borderRadius: 9, alignItems: 'center', marginTop: 14 },
  botaoIniciar: { backgroundColor: '#187657' },
  botaoParar: { backgroundColor: '#a83d43' },
  textoBotao: { color: '#fff', fontWeight: '800', fontSize: 13 },
  rodapeAcao: { color: '#9aa7b5', fontSize: 10, textAlign: 'center', marginTop: 10 },
  cartaoVazio: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginTop: 14 },
  textoVazio: { color: '#718096', fontSize: 12, lineHeight: 18 },
  itemHistorico: { backgroundColor: '#fff', borderRadius: 11, padding: 14, marginTop: 10 },
  historicoTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  horaHistorico: { color: '#34465b', fontSize: 11, fontWeight: '700' },
  origemTag: { fontSize: 9, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12, overflow: 'hidden' },
  origemDemo: { color: '#2866a8', backgroundColor: '#e8f1fb' },
  origemManual: { color: '#6b4a9b', backgroundColor: '#f1eafb' },
  historicoValores: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 13, gap: 8 },
  valorHistorico: { color: '#17345c', fontSize: 12, fontWeight: '700' },
  formulario: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 16 },
  rotuloCampo: { color: '#34465b', fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 8 },
  campo: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#dce4ed', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11, color: '#17345c', fontSize: 14 },
  botaoSalvar: { backgroundColor: '#245caa', padding: 14, borderRadius: 9, alignItems: 'center', marginTop: 18 },
  rodapeAviso: { marginTop: 20, padding: 13, backgroundColor: '#e8eef5', borderRadius: 9 },
  textoAviso: { color: '#53677e', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  descricaoAviso: { color: '#718096', fontSize: 10, lineHeight: 15, marginTop: 5 },
});
