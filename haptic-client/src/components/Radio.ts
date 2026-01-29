export class Radio {
  constructor(
    private text_output: HTMLPreElement,
    private text_output_wrapper: HTMLDivElement,
  ) {}

  public sendMessage(message: string) {
    const line = document.createElement('div');
    line.textContent = message;

    this.text_output.appendChild(line);

    this.text_output_wrapper.scrollTop = this.text_output_wrapper.scrollHeight;
  }
}
