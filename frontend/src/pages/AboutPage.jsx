import { about } from '../data/contentConfig';
import './AboutPage.css';

function AboutPage() {
  return (
    <main className="about-page">
      <div className="page-header">
        <h1>About Me</h1>
        <p>{about.subtitle}</p>
      </div>

      <div className="container">
        <div className="about-content-full">
          <div className="about-text-full">
            <h2 className="about-section-title">My Journey</h2>
            <p className="about-text-paragraph">
              {about.content}
            </p>
            
            <h3 className="about-subsection-title">Areas of Focus</h3>
            <div className="about-highlights-full">
              {about.highlights.map((highlight, idx) => (
                <div key={idx} className="highlight-full">
                  <span className="highlight-number">{idx + 1}</span>
                  <h4 className="highlight-title">{highlight}</h4>
                  <p className="highlight-description">
                    Deep expertise and continuous exploration in this domain.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default AboutPage;
