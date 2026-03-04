const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function getRegisterValidationErrors(formData) {
    const validationErrors = {};
    
    if (!formData.fullName.trim()) {
        validationErrors.fullName = 'El nombre es obligatorio';
    } else if (formData.fullName.trim().length < 2) {
        validationErrors.fullName = 'Mínimo 2 caracteres';
    } else if (!NAME_REGEX.test(formData.fullName.trim())) {
        validationErrors.fullName = 'Solo letras y espacios';
    }
    
    if (!formData.email.trim()) {
        validationErrors.email = 'El correo es obligatorio';
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
        validationErrors.email = 'Correo inválido';
    }

    if (!formData.password) {
        validationErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 8) {
        validationErrors.password = 'Mínimo 8 caracteres';
    } else if (!/[A-Z]/.test(formData.password)) {
        validationErrors.password = 'Incluye al menos una mayúscula';
    } else if (!/[0-9]/.test(formData.password)) {
        validationErrors.password = 'Incluye al menos un número';
    }
    
    if (!formData.confirmPassword) {
        validationErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.confirmPassword !== formData.password) {
        validationErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    return validationErrors;
}
