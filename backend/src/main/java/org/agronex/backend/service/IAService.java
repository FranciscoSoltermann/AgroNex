package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.response.ResumenCampaniaResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class IAService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-2.0-flash}")
    private String geminiModel;

    @Value("${gemini.api.version:v1beta}")
    private String geminiApiVersion;

    @Value("${gemini.api.base-url:https://generativelanguage.googleapis.com}")
    private String geminiApiBaseUrl;

    private final FinanzasService finanzasService;

    public String evaluarCampania(String idCampania, UUID idUsuario) {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty() || geminiApiKey.contains("tu_apy_key")) {
            return "¡Hola! Soy AgroNex AI. Para darte recomendaciones basadas en datos reales, necesitás configurar tu **gemini.api.key** en el archivo *application.properties* del servidor.\n\nMientras tanto, simulando un análisis agroeconómico:\n\n* **Eficiencia Biofísica**: Podríamos ajustar el uso de urea; el margen de respuesta está disminuyendo.\n* **Economía**: El componente de insumos en USD se disparó; convendría cerrar la cotización futura.\n* **GDD y Cosecha**: Estamos cerca de la madurez de cosecha; te sugiero organizar camiones.";
        }

        try {
            ResumenCampaniaResponse resumen = finanzasService.obtenerResumenCampania(UUID.fromString(idCampania), idUsuario);
            String prompt = String.format(
                "Eres un Ingeniero Agrónomo experto y analista de negocios agrícolas avanzado.\n" +
                "Analiza los siguientes datos financieros y técnicos de una campaña agrícola y dame un reporte con 3 puntos clave de mejora agronómica y observaciones de margen/costos.\n\n" +
                "Cultivo: %s\nEstado: %s\nSuperficie: %s Ha\nRendimiento o Quintales Totales de momento: %s qq\nCosto Total por Ha: %s\nIngresos por Ha: %s\nMargen Bruto Total: %s\nROI actual: %s%%\n\n" +
                "Responde en texto con formato Markdown, sé analítico, directo y usa vocabulario técnico en agronomía y finanzas.",
                resumen.getCultivo(),
                resumen.getEstado(),
                resumen.getSuperficieLoteHa() != null ? resumen.getSuperficieLoteHa() : "0",
                resumen.getQuintalesTotales(),
                resumen.getCostoPorHa(),
                resumen.getIngresosPorHa(),
                resumen.getMargenBruto(),
                resumen.getRoiPorcentaje()
            );

            return llamarGemini(prompt);
        } catch (Exception e) {
            return "Hubo un problema al recopilar el contexto para la IA: " + e.getMessage();
        }
    }

    public String chatAgronomico(String pregunta) {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty() || geminiApiKey.contains("tu_apy_key")) {
            return "El módulo de consultas ad hoc de **AgroNex AI** requiere la integración de Google Gemini. Por favor configurá la clave en el servidor. (Esto es una simulación de respuesta técnica).";
        }

        String prompt = "Eres AgroNex AI, un asistente virtual hiper-avanzado diseñado y entrenado para Ingenieros Agrónomos y Productores Agropecuarios en toda la región latinoamericana. Responde de forma concisa, técnica y útil a esta consulta del cliente: " + pregunta;

        try {
            return llamarGemini(prompt);
        } catch (Exception e) {
            return "Error al comunicar con la Inteligencia Artificial de Google Gemini: " + e.getMessage();
        }
    }

    private String llamarGemini(String promptText) {
        RestTemplate restTemplate = new RestTemplate();
        String url = construirUrlGemini(geminiApiVersion, geminiModel);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> part = new HashMap<>();
        part.put("text", promptText);
        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(part));
        requestBody.put("contents", List.of(content));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            return extraerTextoGemini(response);
        } catch (HttpClientErrorException.TooManyRequests tooManyRequests) {
            return construirMensajeCuotaExcedida(tooManyRequests);
        } catch (HttpClientErrorException.NotFound notFound) {
            String fallbackVersion = "v1beta";
            if (fallbackVersion.equalsIgnoreCase(geminiApiVersion)) {
                return "La API de Gemini devolvió un 404. Verificá el modelo configurado en gemini.model y que tu API key tenga acceso: " + notFound.getResponseBodyAsString();
            }

            try {
                String fallbackUrl = construirUrlGemini(fallbackVersion, geminiModel);
                @SuppressWarnings("rawtypes")
                ResponseEntity<Map> fallbackResponse = restTemplate.postForEntity(fallbackUrl, request, Map.class);
                return extraerTextoGemini(fallbackResponse);
            } catch (Exception fallbackError) {
                return "La API de Gemini devolvió un 404 para " + geminiApiVersion + ". Se intentó fallback a v1beta sin éxito: " + fallbackError.getMessage();
            }
        } catch (Exception e) {
            return "La API de Gemini devolvió un error (¿la API Key es válida?): " + e.getMessage();
        }
    }

    private String construirUrlGemini(String apiVersion, String model) {
        String baseUrl = geminiApiBaseUrl.endsWith("/")
            ? geminiApiBaseUrl.substring(0, geminiApiBaseUrl.length() - 1)
            : geminiApiBaseUrl;
        return baseUrl + "/" + apiVersion + "/models/" + model + ":generateContent?key=" + geminiApiKey;
    }

    private String extraerTextoGemini(@SuppressWarnings("rawtypes") ResponseEntity<Map> response) {
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        if (responseBody != null && responseBody.containsKey("candidates")) {
            @SuppressWarnings("rawtypes")
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
            if (!candidates.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> contentRes = (Map<String, Object>) candidates.get(0).get("content");
                if (contentRes == null || !contentRes.containsKey("parts")) {
                    return "Gemini respondió, pero sin bloques de contenido legibles.";
                }

                @SuppressWarnings("unchecked")
                List<Map<String, Object>> parts = (List<Map<String, Object>>) contentRes.get("parts");
                if (!parts.isEmpty() && parts.get(0).containsKey("text")) {
                    return (String) parts.get(0).get("text");
                }
            }
        }

        return "Gemini respondió, pero el formato no se pudo procesar.";
    }

    private String construirMensajeCuotaExcedida(HttpClientErrorException.TooManyRequests error429) {
        String responseBody = error429.getResponseBodyAsString();
        String retryDelay = extraerRetryDelay(responseBody);
        String tiempoEspera = retryDelay == null ? "unos segundos" : retryDelay;

        return "Gemini devolvió 429 (cuota agotada). Reintentá en " + tiempoEspera +
            " y revisá tu plan/cuotas en Google AI Studio. Si querés, temporalmente podés cambiar de proyecto API key o reducir la frecuencia de consultas.";
    }

    private String extraerRetryDelay(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return null;
        }

        Pattern retryInfoPattern = Pattern.compile("\\\"retryDelay\\\"\\s*:\\s*\\\"([^\\\"]+)\\\"");
        Matcher retryInfoMatcher = retryInfoPattern.matcher(responseBody);
        if (retryInfoMatcher.find()) {
            return retryInfoMatcher.group(1);
        }

        Pattern retryTextPattern = Pattern.compile("Please retry in ([0-9.]+s)");
        Matcher retryTextMatcher = retryTextPattern.matcher(responseBody);
        if (retryTextMatcher.find()) {
            return retryTextMatcher.group(1);
        }

        return null;
    }
}
