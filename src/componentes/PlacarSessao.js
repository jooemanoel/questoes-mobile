// Componente de exibição: só recebe dados (props) e mostra.
import { Text, View } from "react-native";
import { useEstilos } from "../estilos";

export default function PlacarSessao({ acertos, erros }) {
  const { cores, e } = useEstilos();

  return (
    <View style={e.placar}>
      <Item rotulo="Acertos" valor={acertos} cor={cores.certo} e={e} />
      <Item rotulo="Erros" valor={erros} cor={cores.errado} e={e} />
    </View>
  );
}

function Item({ rotulo, valor, cor, e }) {
  return (
    <View style={e.placarItem} accessible accessibilityLabel={`${rotulo}: ${valor}`}>
      <Text style={e.placarRotulo}>{rotulo}</Text>
      <Text style={[e.placarValor, cor && { color: cor }]}>{valor}</Text>
    </View>
  );
}
