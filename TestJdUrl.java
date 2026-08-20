import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public class TestJdUrl {
    public static void main(String[] args) throws Exception {
        String AUTHORIZE_URL = "https://signin.johndeere.com/oauth2/aus78tnlaysMraFhC1t7/v1/authorize";
        String USER_SCOPES = "openid profile offline_access ag1 eq1 eq2 org1 org2 files";
        String clientId = "0oau9qp9qsymX0PHd5d7";
        String redirectUri = "http://localhost:8080/api/maquinaria/john-deere/auth/callback";
        String encodedRedirectUri = URLEncoder.encode(redirectUri, StandardCharsets.UTF_8.name());
        String stateNonce = "TEST_NONCE";
        
        String url = AUTHORIZE_URL
                + "?client_id=" + clientId
                + "&response_type=code"
                + "&scope=" + USER_SCOPES.replace(" ", "%20")
                + "&redirect_uri=" + encodedRedirectUri
                + "&state=" + stateNonce;
                
        System.out.println(url);
    }
}
