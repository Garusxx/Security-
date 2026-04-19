import "../style/privacyPolicy.css";

type PrivacyPolicyProps = {
  onClose: () => void;
};

const PrivacyPolicy = ({ onClose }: PrivacyPolicyProps) => {
  return (
    <div className="privacy-overlay" onClick={onClose}>
      <section className="privacy-panel" onClick={(e) => e.stopPropagation()}>
        <button className="privacy-close" type="button" onClick={onClose}>
          x
        </button>

        <p className="privacy-kicker">Privacy Policy</p>
        <h2>Security+ Practice Tests</h2>
        <p className="privacy-updated">Last updated: 19 April 2026</p>

        <div className="privacy-content">
          <h3>Data We Collect</h3>
          <p>
            When you create an account, we collect your username, email address,
            password hash, avatar choice, test attempts, scores, and recent test
            history. We also process technical data needed to run the service,
            such as authentication cookies and server logs.
          </p>

          <h3>How We Use Data</h3>
          <p>
            We use your data to create and secure your account, keep you logged
            in, generate and save your Security+ practice tests, show your
            progress, prevent abuse, and maintain the service.
          </p>

          <h3>Authentication Cookies</h3>
          <p>
            We use a strictly necessary authentication cookie named token. It is
            used only to keep you signed in and protect your account session.
            This cookie is not used for advertising or analytics.
          </p>

          <h3>AI-Generated Tests</h3>
          <p>
            We use OpenAI to generate practice test content. Account details,
            passwords, and test history are not intentionally sent to OpenAI for
            generating questions.
          </p>

          <h3>Service Providers</h3>
          <p>
            The app is hosted using Railway. Data may be processed by hosting,
            database, logging, and AI service providers only as needed to operate
            the app.
          </p>

          <h3>How Long We Keep Data</h3>
          <p>
            We keep account data while your account is active. Test history may
            be limited by the app so recent results can be shown. You can ask for
            your account or personal data to be deleted.
          </p>

          <h3>Your Choices</h3>
          <p>
            You can stop using the service at any time. To request account
            deletion, data deletion, or a copy of your data, contact the site
            owner.
          </p>

          <h3>Security</h3>
          <p>
            Passwords are stored as hashes, and session cookies are HTTP-only.
            No online service can be guaranteed to be completely secure, but we
            use reasonable safeguards to protect account data.
          </p>

          <h3>Contact</h3>
          <p>
            For privacy questions or deletion requests, contact the site owner
            using the contact method provided with this project.
          </p>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
