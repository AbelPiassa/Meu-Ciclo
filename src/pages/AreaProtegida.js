import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";


export default function AreaProtegida() {
    return (
        <View style={styles.container}>

            <Text style={styles.titulo}>
                Área protegida
            </Text>

            <Text style={styles.subtitulo}>
                Você não está sozinha. Aqui você encontra apoio.
            </Text>

            <View style={styles.banner}>
                <Text style={styles.bannerTexto}>
                    Espaço seguro
                </Text>
            </View>

            <Pressable style={styles.card}>
                <View style={styles.cardConteudo}>

                    <View style={styles.iconeContainer}>
                        <Ionicons
                            name="people-outline"
                            size={22}
                            color="#D96A98"
                        />
                    </View>

                    <View>
                        <Text style={styles.cardTitulo}>
                            Rede de Apoio
                        </Text>

                        <Text style={styles.cardDescricao}>
                            Seus contatos de confiança
                        </Text>
                    </View>

                </View>

                <Text style={styles.seta}>›</Text>
            </Pressable>

            <Pressable style={styles.card}>
                <View style={styles.cardConteudo}>

                    <View style={styles.iconeContainer}>
                        <Ionicons
                            name="document-text-outline"
                            size={22}
                            color="#D96A98"
                        />
                    </View>

                    <View>
                        <Text style={styles.cardTitulo}>
                            Diário de Ocorrências
                        </Text>

                        <Text style={styles.cardDescricao}>
                            Registre situações importantes
                        </Text>
                    </View>

                </View>

                <Text style={styles.seta}>›</Text>
            </Pressable>

            <Pressable style={styles.card}>
                <View style={styles.cardConteudo}>

                    <View style={styles.iconeContainer}>
                        <Ionicons
                            name="person-outline"
                            size={22}
                            color="#D96A98"
                        />
                    </View>

                    <View>
                        <Text style={styles.cardTitulo}>
                            Perfil e Configurações
                        </Text>

                        <Text style={styles.cardDescricao}>
                            Seus dados e preferências
                        </Text>
                    </View>

                </View>

                <Text style={styles.seta}>›</Text>
            </Pressable>

            <Pressable style={styles.card}>
                <View style={styles.cardConteudo}>

                    <View style={styles.iconeContainer}>
                        <Ionicons
                            name="help-circle-outline"
                            size={22}
                            color="#D96A98"
                        />
                    </View>

                    <View>
                        <Text style={styles.cardTitulo}>
                            Ajuda
                        </Text>

                        <Text style={styles.cardDescricao}>
                            Canais de apoio e informações
                        </Text>
                    </View>

                </View>

                <Text style={styles.seta}>›</Text>
            </Pressable>

            <Pressable style={styles.botao}>
                <Text style={styles.botaoTexto}>
                    Sair rapidamente • sem alerta
                </Text>
            </Pressable>

            <Pressable style={styles.botao}>
                <Text style={styles.botaoTexto}>
                    Encerrar sessão protegida
                </Text>
            </Pressable>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFF8FA",
        padding: 24,
    },
    titulo: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#2E1735",
        marginBottom: 8,
    },
    subtitulo: {
        fontSize: 15,
        color: "#403644",
        marginBottom: 18,
    },
    banner: {
        height: 135,
        backgroundColor: "#FCE9ED",
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 18,
    },
    bannerTexto: {
        color: "#C56C88",
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    cardTitulo: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#2E1735",
    },
    cardDescricao: {
        fontSize: 13,
        color: "#777077",
        marginTop: 4,
    },
    seta: {
        fontSize: 26,
        color: "#777077",
    },
    botao: {
        borderWidth: 1,
        borderColor: "#FF4057",
        borderRadius: 12,
        padding: 14,
        alignItems: "center",
        marginTop: 10,
    },
    botaoTexto: {
        color: "#FF4057",
        fontWeight: "bold",
    },
    cardConteudo: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconeContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#FCE9ED",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },

});