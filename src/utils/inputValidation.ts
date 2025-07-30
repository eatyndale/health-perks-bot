// Input validation utilities
export class InputValidator {
  static sanitizeText(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') return '';
    return input.trim().slice(0, maxLength);
  }

  static validateIntensity(value: any): boolean {
    return typeof value === 'number' && value >= 0 && value <= 10 && Number.isInteger(value);
  }

  static validateAssessmentAnswer(value: any): boolean {
    return typeof value === 'number' && value >= 0 && value <= 3 && Number.isInteger(value);
  }

  static validateAssessmentAnswers(answers: any[]): boolean {
    if (!Array.isArray(answers) || answers.length === 0) return false;
    return answers.every(answer => this.validateAssessmentAnswer(answer));
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): boolean {
    // At least 8 characters, one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  static validateName(name: string): boolean {
    const sanitized = this.sanitizeText(name, 50);
    return sanitized.length >= 2 && sanitized.length <= 50;
  }

  static sanitizeUserMessage(message: string): string {
    // Remove potentially dangerous content
    const sanitized = this.sanitizeText(message, 2000);
    
    // Remove HTML tags
    const withoutHtml = sanitized.replace(/<[^>]*>/g, '');
    
    // Remove potential script tags even if broken
    const withoutScript = withoutHtml.replace(/script/gi, '');
    
    return withoutScript;
  }

  static validateChatState(state: string): boolean {
    const validStates = [
      'initial',
      'gathering-feeling', 
      'gathering-location',
      'gathering-intensity',
      'creating-statements',
      'tapping',
      'post-tapping',
      'advice'
    ];
    return validStates.includes(state);
  }
}