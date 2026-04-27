-- Tabla para almacenar tokens OAuth de John Deere por usuario
CREATE TABLE IF NOT EXISTS john_deere_token (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario      UUID NOT NULL UNIQUE,
    access_token    TEXT NOT NULL,
    refresh_token   TEXT,
    token_type      VARCHAR(20) DEFAULT 'Bearer',
    scopes          VARCHAR(500),
    expires_at      TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_john_deere_token_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_john_deere_token_usuario ON john_deere_token(id_usuario);
