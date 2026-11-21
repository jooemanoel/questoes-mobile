// Botões do app: "principal" (cheio), "secundario" (contorno) e "link" (texto sublinhado).
import { Pressable, Text } from "react-native";
import { useEstilos } from "../estilos";

export default function Botao({ tipo = "principal", titulo, aoTocar, style }) {
  const { e } = useEstilos();

  if (tipo === "link") {
    return (
      <Pressable onPress={aoTocar} hitSlop={10} accessibilityRole="button" style={style}>
        {({ pressed }) => <Text style={[e.botaoLink, pressed && e.pressionado]}>{titulo}</Text>}
      </Pressable>
    );
  }

  const caixa = tipo === "secundario" ? e.botaoSecundario : e.botaoPrincipal;
  const texto = tipo === "secundario" ? e.botaoSecundarioTexto : e.botaoPrincipalTexto;

  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      style={({ pressed }) => [caixa, pressed && e.pressionado, style]}
    >
      <Text style={texto}>{titulo}</Text>
    </Pressable>
  );
}
