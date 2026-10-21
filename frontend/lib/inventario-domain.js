// @ts-check

export const normalizeStr = (s = "") =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// Mapa de subtipos por tipo de artículo
export const SUBTIPOS_POR_TIPO = {
    SEMILLA: ["Maíz", "Trigo", "Soja", "Girasol", "Sorgo", "Cebada", "Otro"],
    HERBICIDA: ["Glifosato", "Atrazina", "2,4-D", "Dicamba", "Metsulfurón", "Paraquat", "Cletodim", "Pivot", "Flumizin", "Otro"],
    FERTILIZANTE: ["Urea", "Fosfato Diamónico (DAP)", "MAP", "Sulfato de Amonio", "Nitrato de Amonio", "KCl", "NPK", "Otro"],
    INSECTICIDA: ["Cipermetrina", "Clorpirifós", "Lambda-cihalotrina", "Fipronil", "Imidacloprid", "Engeo", "Piretroide", "Otro"],
    INOCULANTE_CURASEMILLA: ["Inoculante Biológico", "Curasemilla Fungicida", "Curasemilla Insecticida", "Pack Inoculante + Curasemilla", "Otro"],
    COMBUSTIBLE: ["Gasoil", "Nafta", "Otro"],
    OTRO: []
};

export const TIPO_LABELS = {
    SEMILLA: "Semilla",
    HERBICIDA: "Herbicida",
    FERTILIZANTE: "Fertilizante",
    INSECTICIDA: "Insecticida",
    INOCULANTE_CURASEMILLA: "Inoculante/Curasemilla",
    COMBUSTIBLE: "Combustible",
    OTRO: "Otro"
};

export const getUnidadLabel = (u = "") => {
    switch (u) {
        case "KILOGRAMOS": return "Kg";
        case "GRAMOS": return "g";
        case "TONELADAS": return "Tn";
        case "LITROS": return "Lts";
        case "CENTIMETROS_CUBICOS": return "cc";
        case "BOLSAS": return "Bolsas";
        case "BIDONES": return "Bidones";
        case "UNIDADES": return "Unidades";
        default: return u || "unidades";
    }
};

export const detectFormaFisica = (nombre = "") => {
    const nom = (nombre || "").toLowerCase().trim();
    if (!nom) return "AMBAS";

    const solidKeywords = [
        "granulado", "granulos", "gránulos", "polvo", "seco", "solido", "sólido",
        "wg", "sg", "wdg", "df", "sp", "tab", "wp", "ws", "gr ", " 90%", " 80%", " 70%", "70 dg",
        "turba", "cristales", "perlado"
    ];

    const liquidKeywords = [
        "liquido", "líquido", "líquida", "liquida", "solucion", "solución",
        "ec", "sl", "sc", "cs", "ew", "me", "fs", "uan", "sachet", "vejiga", "fertirriego"
    ];

    const hasSolidWord = solidKeywords.some(k => {
        const regex = new RegExp(`\\b${k.trim()}\\b`, "i");
        return regex.test(nom) || nom.includes(k);
    });

    const hasLiquidWord = liquidKeywords.some(k => {
        const regex = new RegExp(`\\b${k.trim()}\\b`, "i");
        return regex.test(nom) || nom.includes(k);
    });

    if (hasSolidWord && !hasLiquidWord) return "SOLIDO";
    if (hasLiquidWord && !hasSolidWord) return "LIQUIDO";

    return "AMBAS";
};

export const getUnidadesDisponibles = (tipoArticulo, nombre = "", subtipo = "") => {
    const text = `${nombre || ""} ${subtipo || ""}`;
    const nom = text.toLowerCase().trim();
    const forma = detectFormaFisica(text);

    const isStrictlySolid = nom.includes("metsulfuron") || nom.includes("metsulfurón") ||
        nom.includes("dap") || nom.includes("fosfato diamonico") || nom.includes("fosfato diamónico") ||
        nom.includes("kcl") || nom.includes("cloruro de potasio");

    const isStrictlyLiquid = nom.includes("paraquat") ||
        nom.includes("cletodim") || nom.includes("clethodim") ||
        nom.includes("engeo");

    if (isStrictlySolid) {
        if (tipoArticulo === "FERTILIZANTE") {
            return [
                { value: "TONELADAS", label: "Toneladas" },
                { value: "KILOGRAMOS", label: "Kilogramos" }
            ];
        }
        return [
            { value: "KILOGRAMOS", label: "Kilogramos" },
            { value: "GRAMOS", label: "Gramos" }
        ];
    }

    if (isStrictlyLiquid) {
        return [
            { value: "LITROS", label: "Litros" },
            { value: "CENTIMETROS_CUBICOS", label: "Centímetros Cúbicos" }
        ];
    }

    if (tipoArticulo === "HERBICIDA") {
        if (forma === "LIQUIDO") {
            return [
                { value: "LITROS", label: "Litros" },
                { value: "CENTIMETROS_CUBICOS", label: "Centímetros Cúbicos" }
            ];
        }
        if (forma === "SOLIDO") {
            return [
                { value: "KILOGRAMOS", label: "Kilogramos" },
                { value: "GRAMOS", label: "Gramos" }
            ];
        }
        return [
            { value: "LITROS", label: "Litros" },
            { value: "CENTIMETROS_CUBICOS", label: "Centímetros Cúbicos" },
            { value: "KILOGRAMOS", label: "Kilogramos" },
            { value: "GRAMOS", label: "Gramos" }
        ];
    }

    if (tipoArticulo === "FERTILIZANTE") {
        if (forma === "LIQUIDO") {
            return [
                { value: "LITROS", label: "Litros" },
                { value: "CENTIMETROS_CUBICOS", label: "Centímetros Cúbicos" }
            ];
        }
        if (forma === "SOLIDO") {
            return [
                { value: "TONELADAS", label: "Toneladas" },
                { value: "KILOGRAMOS", label: "Kilogramos" }
            ];
        }
        return [
            { value: "TONELADAS", label: "Toneladas" },
            { value: "KILOGRAMOS", label: "Kilogramos" },
            { value: "LITROS", label: "Litros" }
        ];
    }

    if (tipoArticulo === "INSECTICIDA") {
        if (forma === "SOLIDO") {
            return [
                { value: "KILOGRAMOS", label: "Kilogramos" },
                { value: "GRAMOS", label: "Gramos" }
            ];
        }
        if (forma === "LIQUIDO") {
            return [
                { value: "LITROS", label: "Litros" },
                { value: "CENTIMETROS_CUBICOS", label: "Centímetros Cúbicos" }
            ];
        }
        return [
            { value: "LITROS", label: "Litros" },
            { value: "CENTIMETROS_CUBICOS", label: "Centímetros Cúbicos" },
            { value: "KILOGRAMOS", label: "Kilogramos" },
            { value: "GRAMOS", label: "Gramos" }
        ];
    }

    if (tipoArticulo === "INOCULANTE_CURASEMILLA") {
        if (forma === "SOLIDO") {
            return [
                { value: "KILOGRAMOS", label: "Kilogramos" },
                { value: "GRAMOS", label: "Gramos" }
            ];
        }
        if (forma === "LIQUIDO") {
            return [
                { value: "CENTIMETROS_CUBICOS", label: "Centímetros Cúbicos" },
                { value: "LITROS", label: "Litros" }
            ];
        }
        return [
            { value: "CENTIMETROS_CUBICOS", label: "Centímetros Cúbicos" },
            { value: "LITROS", label: "Litros" },
            { value: "KILOGRAMOS", label: "Kilogramos" },
            { value: "GRAMOS", label: "Gramos" }
        ];
    }

    if (tipoArticulo === "COMBUSTIBLE") {
        return [
            { value: "LITROS", label: "Litros" }
        ];
    }

    return [
        { value: "KILOGRAMOS", label: "Kilogramos" },
        { value: "GRAMOS", label: "Gramos" },
        { value: "LITROS", label: "Litros" },
        { value: "CENTIMETROS_CUBICOS", label: "Centímetros Cúbicos" },
        { value: "TONELADAS", label: "Toneladas" }
    ];
};

export const getSemillaType = (tipoArticulo, subtipo = "", nombre = "") => {
    if (tipoArticulo !== "SEMILLA") return null;
    const sub = (subtipo || "").toLowerCase();
    const nom = (nombre || "").toLowerCase();

    if (sub.includes("maíz") || sub.includes("maiz") || nom.includes("maíz") || nom.includes("maiz")) {
        return "MAIZ";
    }
    if (sub.includes("girasol") || nom.includes("girasol") || sub.includes("sorgo") || nom.includes("sorgo")) {
        return "GIRASOL";
    }
    if (sub.includes("trigo") || nom.includes("trigo") || sub.includes("soja") || nom.includes("soja")) {
        return "TRIGO_SOJA";
    }
    return "OTRO";
};

export const isSemillaPorUnidades = (tipoArticulo, subtipo = "", nombre = "") => {
    const type = getSemillaType(tipoArticulo, subtipo, nombre);
    return type === "MAIZ" || type === "GIRASOL";
};
