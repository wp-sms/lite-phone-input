import type { PhoneInputOptions } from '../core/types';

export class PhoneInput {
  static mount(
    _el: HTMLElement,
    _options: PhoneInputOptions,
  ): PhoneInput {
    // TODO: implement
    return new PhoneInput();
  }

  getValue(): string {
    return '';
  }

  getNationalNumber(): string {
    return '';
  }

  destroy(): void {
    // TODO: implement
  }
}
