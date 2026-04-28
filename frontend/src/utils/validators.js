const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^[\+]?[0-9\s\-\(\)]+$/;
const POSTAL_CODE_REGEX = /^[0-9]{5,10}$/;

export function getRegisterValidationErrors(formData) {
    const validationErrors = {};

    // Validaciones de información personal
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

    if (formData.phoneNumber && !PHONE_REGEX.test(formData.phoneNumber.trim())) {
        validationErrors.phoneNumber = 'Formato de teléfono inválido';
    }

    if (!formData.password) {
        validationErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 6) {
        validationErrors.password = 'Mínimo 6 caracteres';
    }

    if (!formData.confirmPassword) {
        validationErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.confirmPassword !== formData.password) {
        validationErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    // Validaciones de información de hogar/empresa
    if (!formData.userType) {
        validationErrors.userType = 'Selecciona el tipo de usuario';
    }

    if (!formData.householdName.trim()) {
        validationErrors.householdName = 'El nombre del hogar/empresa es obligatorio';
    } else if (formData.householdName.trim().length < 2) {
        validationErrors.householdName = 'Mínimo 2 caracteres';
    }

    if (!formData.address.trim()) {
        validationErrors.address = 'La dirección es obligatoria';
    } else if (formData.address.trim().length < 5) {
        validationErrors.address = 'Dirección muy corta';
    }

    if (!formData.city.trim()) {
        validationErrors.city = 'La ciudad es obligatoria';
    } else if (formData.city.trim().length < 2) {
        validationErrors.city = 'Mínimo 2 caracteres';
    }

    if (!formData.postalCode.trim()) {
        validationErrors.postalCode = 'El código postal es obligatorio';
    } else if (!POSTAL_CODE_REGEX.test(formData.postalCode.trim())) {
        validationErrors.postalCode = 'Formato de código postal inválido';
    }

    // Validaciones de información energética
    if (!formData.primaryRole) {
        validationErrors.primaryRole = 'Selecciona tu rol en la comunidad';
    }

    // Validaciones condicionales para productores
    if (formData.primaryRole === 'producer' || formData.primaryRole === 'prosumer') {
        if (
            formData.installedCapacityKwh &&
            parseFloat(formData.installedCapacityKwh) <= 0
        ) {
            validationErrors.installedCapacityKwh = 'La capacidad debe ser mayor a 0';
        }
    }

    if (
        formData.averageMonthlyConsumptionKwh &&
        parseFloat(formData.averageMonthlyConsumptionKwh) <= 0
    ) {
        validationErrors.averageMonthlyConsumptionKwh = 'El consumo debe ser mayor a 0';
    }

    return validationErrors;
}
