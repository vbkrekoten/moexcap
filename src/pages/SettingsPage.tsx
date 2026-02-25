import Section from '../components/ui/Section';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Section title="НАСТРОЙКИ">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm text-muted mb-2">Pro API Keys</h3>
            <p className="text-xs text-muted">Будет реализовано в Milestone 5.</p>
          </div>
          <div>
            <h3 className="text-sm text-muted mb-2">Аккаунт</h3>
            <p className="text-xs text-muted">Управление аккаунтом — Milestone 1.</p>
          </div>
        </div>
      </Section>
    </div>
  );
}
