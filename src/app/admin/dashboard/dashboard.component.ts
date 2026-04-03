import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

const API = 'http://localhost:8080/api';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  // ── Layout ──
  sidebarCollapsed = false;
  activeTab = 'dashboard';
  modal: string | null = null;
  modalLoading = false;
  modalError = '';
  toast = '';
  toastType: 'success' | 'error' = 'success';
  editingId: number | null = null;
  editingKey: string | null = null;

  get pageTitle(): string {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      courses: 'Courses',
      faqs: 'FAQs',
      intents: 'Intents',
      trainers: 'Trainers',
      config: 'Bot Config'
    };
    return titles[this.activeTab] ?? 'Dashboard';
  }

  // ── Stats ──
  stats = { courses: 0, faqs: 0, intents: 0, trainers: 0 };

  // ── Courses ──
  courses: any[] = [];
  coursePage = 0;
  courseTotalPages = 1;
  courseFilter = { name: '', mode: '', isActive: '' };
  courseForm: any = {};

  // ── FAQs ──
  faqs: any[] = [];
  faqPage = 0;
  faqTotalPages = 1;
  faqFilter = { question: '', isActive: '' };
  faqForm: any = {};

  // ── Intents ──
  intents: any[] = [];
  intentPage = 0;
  intentTotalPages = 1;
  intentForm: any = {};

  // ── Trainers ──
  trainers: any[] = [];
  trainerPage = 0;
  trainerTotalPages = 1;
  trainerFilter = { name: '', specialization: '' };
  trainerForm: any = {};

  // ── Configs ──
  configs: any[] = [];
  configPage = 0;
  configTotalPages = 1;
  configFilter = { key: '' };
  configForm: any = {};

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadStats();
  }

  // ══════════════════════════════════════════
  // TAB NAVIGATION
  // ══════════════════════════════════════════
  setTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'courses') this.loadCourses();
    if (tab === 'faqs') this.loadFaqs();
    if (tab === 'intents') this.loadIntents();
    if (tab === 'trainers') this.loadTrainers();
    if (tab === 'config') this.loadConfigs();
  }

  logout() {
    this.auth.logout();
  }

  // ══════════════════════════════════════════
  // STATS
  // ══════════════════════════════════════════
  loadStats() {
    this.http.get<any>(`${API}/courses?size=1`).subscribe(r => this.stats.courses = r.totalElements ?? 0);
    this.http.get<any>(`${API}/faqs?size=1`).subscribe(r => this.stats.faqs = r.totalElements ?? 0);
    this.http.get<any>(`${API}/intents?size=1`).subscribe(r => this.stats.intents = r.totalElements ?? 0);
    this.http.get<any>(`${API}/trainers?size=1`).subscribe(r => {
      const body = r.data ?? r;
      this.stats.trainers = body.totalElements ?? 0;
    });
  }

  // ══════════════════════════════════════════
  // COURSES
  // ══════════════════════════════════════════
  loadCourses() {
    let url = `${API}/courses?page=${this.coursePage}&size=8`;
    if (this.courseFilter.name) url += `&name=${this.courseFilter.name}`;
    if (this.courseFilter.mode) url += `&mode=${this.courseFilter.mode}`;
    if (this.courseFilter.isActive !== '') url += `&isActive=${this.courseFilter.isActive}`;

    this.http.get<any>(url).subscribe(res => {
      this.courses = res.content ?? [];
      this.courseTotalPages = res.totalPages ?? 1;
    });
  }

  editCourse(c: any) {
    this.editingId = c.id;
    this.courseForm = { ...c };
    this.modal = 'course';
  }

  saveCourse() {
    if (!this.courseForm.name || !this.courseForm.mode) {
      this.modalError = 'Name and Mode are required.';
      return;
    }
    this.modalLoading = true;
    this.modalError = '';
    const req = this.editingId
      ? this.http.put(`${API}/courses/${this.editingId}`, this.courseForm)
      : this.http.post(`${API}/courses`, this.courseForm);

    req.subscribe({
      next: () => { this.closeModal(); this.loadCourses(); this.loadStats(); this.showToast('Course saved!'); },
      error: () => { this.modalLoading = false; this.modalError = 'Save failed. Check your input.'; }
    });
  }

toggleCourseStatus(c: any) {
  this.http.patch(`${API}/courses/${c.id}/status?status=${!c.status}`, {}, { responseType: 'text' })
    .subscribe({
      next: () => { c.status = !c.status; this.showToast('Status updated!'); },  //  c.status not c.isActive
      error: () => this.showToast('Failed to toggle status.', 'error')
    });
}

  deleteCourse(id: number) {
    if (!confirm('Delete this course?')) return;

    this.http.delete(`${API}/courses/${id}`, { responseType: 'text' })
      .subscribe({
        next: () => {
          this.courses = this.courses.filter(c => c.id !== id); // instant UI
          this.showToast('Course deleted.');
        },
        error: () => this.showToast('Delete failed.', 'error')
      });
  }
  // ══════════════════════════════════════════
  // FAQS
  // ══════════════════════════════════════════
  loadFaqs() {
    let url = `${API}/faqs?page=${this.faqPage}&size=8`;
    if (this.faqFilter.question) url += `&question=${this.faqFilter.question}`;
    if (this.faqFilter.isActive !== '') url += `&isActive=${this.faqFilter.isActive}`;

    this.http.get<any>(url).subscribe(res => {
      this.faqs = res.content ?? [];
      this.faqTotalPages = res.totalPages ?? 1;
    });
  }

  editFaq(f: any) {
    this.editingId = f.id;
    this.faqForm = { ...f };
    this.modal = 'faq';
  }

  saveFaq() {
    if (!this.faqForm.question || !this.faqForm.answer) {
      this.modalError = 'Question and Answer are required.';
      return;
    }
    this.modalLoading = true;
    this.modalError = '';
    const req = this.editingId
      ? this.http.put(`${API}/faqs/${this.editingId}`, this.faqForm)
      : this.http.post(`${API}/faqs`, this.faqForm);

    req.subscribe({
      next: () => { this.closeModal(); this.loadFaqs(); this.loadStats(); this.showToast('FAQ saved!'); },
      error: () => { this.modalLoading = false; this.modalError = 'Save failed.'; }
    });
  }

toggleFaqStatus(f: any) {
  this.http.patch(`${API}/faqs/${f.id}/status?status=${!f.status}`, {}, { responseType: 'text' })
    .subscribe({
      next: () => { f.status = !f.status; this.showToast('Status updated!'); },  // 
      error: () => this.showToast('Failed to toggle status.', 'error')
    });
}

  deleteFaq(id: number) {
    if (!confirm('Delete this FAQ?')) return;

    this.http.delete(`${API}/faqs/${id}`, { responseType: 'text' })
      .subscribe({
        next: () => {
          this.faqs = this.faqs.filter(f => f.id !== id); // instant UI
          this.showToast('FAQ deleted.');
        },
        error: () => this.showToast('Delete failed.', 'error')
      });
  }

  // ══════════════════════════════════════════
  // INTENTS
  // ══════════════════════════════════════════
  loadIntents() {
    this.http.get<any>(`${API}/intents?page=${this.intentPage}&size=8`).subscribe(res => {
      this.intents = res.content ?? [];
      this.intentTotalPages = res.totalPages ?? 1;
    });
  }

editIntent(i: any) {
  this.editingId = i.id;
  this.intentForm = {
    intentName: i.intentName,
    keywords: i.keywords,
    actionType: i.actionType,
    responseTemplate: i.responseTemplate,
    status: i.status
  };
  this.modal = 'intent';
}

 saveIntent() {
  if (!this.intentForm.intentName || !this.intentForm.keywords || !this.intentForm.actionType) {
    this.modalError = 'Intent Name, Keywords and Action Type are required.';
    return;
  }
  const payload = {
    intentName: this.intentForm.intentName,
    keywords: this.intentForm.keywords,
    actionType: this.intentForm.actionType,
    responseTemplate: this.intentForm.responseTemplate,
    status: true
  };
  this.modalLoading = true;
  this.modalError = '';
  const req = this.editingId
    ? this.http.put(`${API}/intents/${this.editingId}`, payload)
    : this.http.post(`${API}/intents`, payload);

  req.subscribe({
    next: () => { this.closeModal(); this.loadIntents(); this.loadStats(); this.showToast('Intent saved!'); },
    error: () => { this.modalLoading = false; this.modalError = 'Save failed.'; }
  });
}

  toggleIntentStatus(i: any) {
  this.http.patch(`${API}/intents/${i.id}/status?status=${!i.status}`, {}, { responseType: 'text' })
    .subscribe({
      next: () => { i.status = !i.status; this.showToast('Status updated!'); },
      error: () => this.showToast('Failed.', 'error')
    });
}


  deleteIntent(id: number) {
    if (!confirm('Delete this intent?')) return;

    this.http.delete(`${API}/intents/${id}`, { responseType: 'text' })
      .subscribe({
        next: () => {
          this.intents = this.intents.filter(i => i.id !== id);
          this.showToast('Intent deleted.');
        },
        error: () => this.showToast('Delete failed.', 'error')
      });
  }

  // ══════════════════════════════════════════
  // TRAINERS
  // ══════════════════════════════════════════
  loadTrainers() {
    let url = `${API}/trainers?page=${this.trainerPage}&size=8`;
    if (this.trainerFilter.name) url += `&name=${this.trainerFilter.name}`;
    if (this.trainerFilter.specialization) url += `&specialization=${this.trainerFilter.specialization}`;

    this.http.get<any>(url).subscribe(res => {
      // Trainer API wraps in ApiResponseDTO
      const body = res.data ?? res;
      this.trainers = body.content ?? [];
      this.trainerTotalPages = body.totalPages ?? 1;
    });
  }

  editTrainer(t: any) {
    this.editingId = t.id;
    this.trainerForm = { ...t };
    this.modal = 'trainer';
  }

  saveTrainer() {
    if (!this.trainerForm.name || !this.trainerForm.email || !this.trainerForm.specialization) {
      this.modalError = 'Name, Email, and Specialization are required.';
      return;
    }
    this.modalLoading = true;
    this.modalError = '';
    const req = this.editingId
      ? this.http.put(`${API}/trainers/${this.editingId}`, this.trainerForm)
      : this.http.post(`${API}/trainers`, this.trainerForm);

    req.subscribe({
      next: () => { this.closeModal(); this.loadTrainers(); this.loadStats(); this.showToast('Trainer saved!'); },
      error: () => { this.modalLoading = false; this.modalError = 'Save failed.'; }
    });
  }

  toggleTrainerStatus(t: any) {
  this.http.patch(`${API}/trainers/${t.id}/status?status=${!t.status}`, {}, { responseType: 'text' })
    .subscribe({
      next: () => { t.status = !t.status; this.showToast('Status updated!'); },
      error: () => this.showToast('Failed.', 'error')
    });
}

  deleteTrainer(id: number) {
    if (!confirm('Delete this trainer?')) return;

    this.http.delete(`${API}/trainers/${id}`, { responseType: 'text' })
      .subscribe({
        next: () => {
          this.trainers = this.trainers.filter(t => t.id !== id);
          this.showToast('Trainer deleted.');
        },
        error: () => this.showToast('Delete failed.', 'error')
      });
  }

  // ══════════════════════════════════════════
  // BOT CONFIG
  // ══════════════════════════════════════════
loadConfigs() {
  let url = `${API}/config?page=${this.configPage}&size=10`;
  if (this.configFilter.key) url += `&key=${this.configFilter.key}`;  //  this is fine

  this.http.get<any>(url).subscribe(res => {
    this.configs = res.content ?? [];
    this.configTotalPages = res.totalPages ?? 1;
  });
}

 editConfig(cfg: any) {
  this.editingKey = cfg.configKey;          //  was cfg.key
  this.configForm = { 
    key: cfg.configKey,                      //  map to form fields
    value: cfg.configValue 
  };
  this.modal = 'config';
}

saveConfig() {
  if (!this.configForm.key || !this.configForm.value) {
    this.modalError = 'Key and Value are required.';
    return;
  }
  this.modalLoading = true;
  this.modalError = '';
  const payload = { configKey: this.configForm.key, configValue: this.configForm.value };  // ✅
  const req = this.editingKey
    ? this.http.put(`${API}/config/${this.editingKey}`, payload)
    : this.http.post(`${API}/config`, payload);

  req.subscribe({
    next: () => { this.closeModal(); this.loadConfigs(); this.showToast('Config saved!'); },
    error: () => { this.modalLoading = false; this.modalError = 'Save failed.'; }
  });
}

deleteConfig(key: string) {
  if (!confirm(`Delete config key "${key}"?`)) return;
  this.http.delete(`${API}/config/${key}`, { responseType: 'text' })
    .subscribe({
      next: () => { this.loadConfigs(); this.showToast('Config deleted.'); },
      error: () => this.showToast('Delete failed.', 'error')
    });
}

  // ══════════════════════════════════════════
  // MODAL HELPERS
  // ══════════════════════════════════════════
  openModal(type: string) {
    this.modal = type;
    this.editingId = null;
    this.editingKey = null;
    this.modalError = '';
    this.modalLoading = false;

    // reset forms
    this.courseForm = { isActive: true };
    this.faqForm = { isActive: true };
    this.intentForm = { intentName: '', keywords: '', actionType: '', responseTemplate: '', status: true };
    this.trainerForm = {};
    this.configForm = {};
  }

  closeModal() {
    this.modal = null;
    this.editingId = null;
    this.editingKey = null;
    this.modalError = '';
    this.modalLoading = false;
  }

  showToast(msg: string, type: 'success' | 'error' = 'success') {
    this.toast = msg;
    this.toastType = type;
    setTimeout(() => this.toast = '', 3000);
  }
}