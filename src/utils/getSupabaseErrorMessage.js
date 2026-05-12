export const getSupabaseErrorMessage = (error) => {
  if (!error) return "Error desconocido.";

  // UNIQUE CONSTRAINT
  if (error.code === "23505") {
    // DNI duplicado
    if (error.message.includes("patients_dni_key")) {
      return "Ya existe un paciente registrado con ese DNI.";
    }

    return "Ya existe un registro con esos datos.";
  }

  // CHECK CONSTRAINT
  if (error.code === "23514") {
    return "Algunos datos ingresados no son válidos.";
  }

  // NOT NULL
  if (error.code === "23502") {
    return "Faltan campos obligatorios.";
  }

  // FOREIGN KEY
  if (error.code === "23503") {
    return "No se puede realizar la operación por relación de datos.";
  }

  // INVALID DATE
  if (error.code === "22007") {
    return "La fecha ingresada no es válida.";
  }

  // FALLBACK
  return error.message || "Ocurrió un error inesperado.";
};