-- Table des bornes
CREATE TABLE IF NOT EXISTS bornes (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) NOT NULL,
    numero_serie VARCHAR(100) NOT NULL,
    antenne_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX idx_bornes_numero ON bornes(numero);
CREATE INDEX idx_bornes_numero_serie ON bornes(numero_serie);
CREATE INDEX idx_bornes_antenne_id ON bornes(antenne_id);

-- Données de test
INSERT INTO bornes (numero, numero_serie, antenne_id) VALUES
    ('B001', 'SN-2024-001', 1),
    ('B002', 'SN-2024-002', 1),
    ('B003', 'SN-2024-003', 2),
    ('B004', 'SN-2024-004', 3);
