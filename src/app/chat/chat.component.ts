import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, AfterViewChecked {

  @ViewChild('chatBox') chatBox!: ElementRef;

  userInput: string = '';
  messages: any[] = [];
  wordCount: number = 0;
  isTyping: boolean = false;

  useCodeDisha: boolean = true;

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.messages.push({
      text: "Welcome to CodeDisha! 👋 How can I help you today?",
      type: 'bot',
      options: [
        "Explore Courses",
        "Trainer Details",
        "Batch Timings",
        "Mode (Online/Offline)",
        "Placement Support",
        "Contact Us"
      ],
      optionsUsed: false
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  /**
   * Converts \n line breaks to <br> tags so the browser renders them correctly.
   * Also bolds the first line (used as a title in most responses).
   * DomSanitizer marks the result as safe HTML.
   */
  formatMessage(text: string): SafeHtml {
    if (!text) return '';

    const lines = text.split('\n');
    let html = '';

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (trimmed === '') {
        // Blank line → paragraph spacing
        html += '<br>';
      } else if (index === 0 && trimmed !== '') {
        // First line → bold title
        html += `<strong>${this.escapeHtml(trimmed)}</strong>`;
      } else {
        html += this.escapeHtml(line);
      }

      if (index < lines.length - 1) {
        html += '<br>';
      }
    });

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private scrollToBottom() {
    try {
      const el = this.chatBox.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch (e) {}
  }

  onInputChange() {
    if (!this.userInput) {
      this.wordCount = 0;
      return;
    }
    this.wordCount = this.userInput.trim().split(/\s+/).length;
  }

  sendMessage() {
    if (!this.userInput.trim() || this.isTyping) return;

    if (this.wordCount > 100) {
      this.messages.push({ text: "Please ask a shorter question (max 100 words).", type: 'bot' });
      return;
    }

    const message = this.userInput;
    this.messages.push({ text: message, type: 'user' });
    this.userInput = '';
    this.wordCount = 0;
    this.isTyping = true;

    const url = this.useCodeDisha
      ? 'http://localhost:8080/chat/codedisha'
      : 'http://localhost:8080/chat';

    this.http.post<any>(url, { message }).subscribe({
      next: (res) => {
        this.isTyping = false;
        this.messages.push({
          text: res.message,
          type: 'bot',
          options: res.options || [],
          optionsUsed: false
        });
      },
      error: () => {
        this.isTyping = false;
        this.messages.push({ text: 'Server error. Please try again.', type: 'bot' });
      }
    });
  }

  selectOption(msg: any, option: string) {
    msg.optionsUsed = true;
    this.userInput = option;
    this.sendMessage();
  }
}