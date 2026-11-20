function nombreHabito(habito) {
    const nombres = new Map([
        ["reducir_redes", "Reducir el uso de redes sociales"],
        ["mejorar_sueno", "Mejorar mis hábitos de sueño"],
        ["actividad_fisica", "Aumentar la actividad física"],
        ["alimentacion", "Mejorar mi alimentación"],
        ["estudio", "Mejorar mi concentración y estudio"]
    ]);
    return nombres.get(habito) ?? habito;
}
