-- ============================================================
--  Videos / Talks Page CMS — Seed Data
--  Database: vkulkarni-react
--  Run schema_videos.sql before this file.
--  Safe to re-run: clears and re-inserts all rows.
--
--  thumb_url uses YouTube auto-thumbnails so the page
--  renders without bundled assets. Upload custom thumbnails
--  via Admin → Videos → Edit to replace them.
-- ============================================================

SET NAMES utf8mb4;

-- ── Clear existing data ───────────────────────────────────
DELETE FROM vid_hero;
DELETE FROM vid_videos;
DELETE FROM vid_sidebar;

ALTER TABLE vid_hero    AUTO_INCREMENT = 1;
ALTER TABLE vid_videos  AUTO_INCREMENT = 1;
ALTER TABLE vid_sidebar AUTO_INCREMENT = 1;


-- ============================================================
--  HERO
-- ============================================================
INSERT INTO vid_hero (eyebrow, title, title_em, subtitle, breadcrumb) VALUES (
  'Media',
  'Talks &',
  'Podcasts',
  'Conversations, lectures, and keynotes on Indian Knowledge Systems, Dharmic leadership, and civilisational thinking.',
  'Talks'
);


-- ============================================================
--  SIDEBAR
-- ============================================================
INSERT INTO vid_sidebar (quote_text, quote_attr, invite_title, invite_text, invite_btn_label) VALUES (
  'The teacher who does not know the student''s Svabhāva is not teaching — they are broadcasting.',
  '— Vinay Kulkarni',
  'Invite Vinay',
  'Vinay speaks on IKS, Dharmic leadership, education, and civilizational futures. Available for keynotes, panels, and academic engagements.',
  'Book a Session'
);


-- ============================================================
--  VIDEOS
--  thumb_url = YouTube auto-thumbnail (hqdefault.jpg).
--  Replace per-video via Admin → Videos → Edit → Upload Thumbnail.
-- ============================================================

INSERT INTO vid_videos (type, title, description, date_text, host, watch_label, thumb_url, video_url, tags_json, sort_order) VALUES

('Lecture',
 'Re-Imagining The World Through Indian Knowledge Systems',
 'The lens through which we Bharatiya view the world, our own culture and civilization, our history and our spiritual processes — just about everything is not really ours. It was the lens we accepted and internalized during our colonial experience. What if we could see the world afresh with our own lenses and frameworks? That was the question we sat with at JAIN (Deemed-to-be University) in January, in a course on Viewing the World Through Indian Knowledge Systems.',
 'Jun 11, 2026',
 'Vinay Kulkarni Online',
 'Listen',
 'https://img.youtube.com/vi/twrPcG9Zmjk/hqdefault.jpg',
 'https://youtu.be/twrPcG9Zmjk?si=nOh4RcOIQXJeYe_B',
 '["IKS","Education"]',
 0),

('Lecture',
 'Digital Tools for Documentation, Preservation and Dissemination of IKS',
 'When I prepared my session for the JAIN University Faculty Development Programme on Digital Tools for the Documentation, Preservation, and Dissemination of Indian Knowledge Systems, I thought it would be a routine survey of portals, apps, and government missions. It turned out to be something else. The question is not technical.',
 'Jun 11, 2026',
 'Vinay Kulkarni Online',
 'Listen',
 'https://img.youtube.com/vi/twrPcG9Zmjk/hqdefault.jpg',
 'https://youtu.be/twrPcG9Zmjk?si=nOh4RcOIQXJeYe_B',
 '["IKS","DigitalTools","Education"]',
 1),

('Lecture',
 'Code, Consciousness and Responsibility: Mind, AI & Dharmic Design | AI & IKS | Shri Vinay Kulkarni',
 'In this session, Vinay Kulkarni explores the relationship between AI, human cognition, and the concept of consciousness through the lens of Indian Knowledge Systems.',
 'Apr 22, 2026',
 'IKS IIT Kanpur',
 'Watch',
 'https://img.youtube.com/vi/G3rH4FztvYQ/hqdefault.jpg',
 'https://youtu.be/G3rH4FztvYQ?si=OyEgOL8wKY3nAm0N',
 '["IKS","AIandIKS","AIethics","Consciousness","Education"]',
 2),

('Podcast',
 'In Search Of The Real India | Vinay Kulkarni',
 'Vinay Kulkarni is an experienced management advisor (strategy, marketing, e-commerce) and Founder & CEO of Alchmi and E-com Elephant. He has a BE (Mech) from the Univ. of Mysore, an MBA (Strategy & Marketing) and a MS degree (Systems & Industrial Engg) both from the University of Arizona, USA.',
 'Sep 11, 2024',
 'INDICA',
 'Watch',
 'https://img.youtube.com/vi/lijINSuDl2Q/hqdefault.jpg',
 'https://youtu.be/lijINSuDl2Q?si=t_8JNNH8oy5bUxpn',
 '["IKS","Upanishads","Education"]',
 3),

('Panel Discussion',
 'Indian Knowledge Systems (IKS) as a Framework for Modern Education and Research',
 'Mr. Vinay Kulkarni – Founder & CEO, ALCHMI • Dr. Prathosh A. P – Assistant Professor, IISc • Prof. Shailaja D Sharma – Professor of Mathematics, Azim Premji University & NIAS. UVS–7 examined IKS as a living and functional framework for modern education, research, and innovation.',
 'May 8, 2026',
 'Param Foundation',
 'Watch',
 'https://img.youtube.com/vi/WABc88ZRQpU/hqdefault.jpg',
 'https://youtu.be/WABc88ZRQpU?si=mAm96HJg-Jpl_-CW',
 '["IKS","Nation Building"]',
 4),

('Panel Discussion',
 'GOF 2026 | Panel Discussion On Vedanta and Education',
 'A wide-ranging conversation on the relevance of Vedantic principles to modern education, exploring how concepts like Dharma, Svabhāva, and the pursuit of knowledge can inform a more holistic and meaningful educational experience.',
 'May 17, 2026',
 'Advaita Academy',
 'Watch',
 'https://img.youtube.com/vi/2pqUo6j2HK8/hqdefault.jpg',
 'https://youtu.be/2pqUo6j2HK8?si=f89FFzjqhXnCewEH',
 '["Psychology","IKS","Dharma"]',
 5),

('Panel Discussion',
 'Purvaranga to adopting the Indic Knowledge Systems (IKS) — Episode 1: Colonisation of Cognition',
 'How has modern education shaped and perhaps limited the way we think, perceive, and know? This webinar opens a vital conversation on the Colonization of Cognition.',
 'Apr 4, 2026',
 'Zista 3E4I',
 'Watch',
 'https://img.youtube.com/vi/NuKMqG8X4JQ/hqdefault.jpg',
 'https://youtu.be/NuKMqG8X4JQ?si=Tt_QjNYbQKaecEQY',
 '["Education","IKS"]',
 6),

('Panel Discussion',
 'Session 31: Spirituo-Scientific Domain: From the Shadows to the Spotlight — Episode 2',
 'The session explores the transformative potential of the spirituo-scientific domain and its emerging significance in contemporary discourse, examining how this domain fosters holistic understanding and innovation.',
 'Aug 1, 2025',
 'Quantum Consciousness',
 'Watch',
 'https://img.youtube.com/vi/Eo3nSg8vADI/hqdefault.jpg',
 'https://youtu.be/Eo3nSg8vADI?si=ccBf8THVwmrTsWW5',
 '["Dharmic Innovation","Entrepreneurship"]',
 7),

('Panel Discussion',
 'Session 20: GI4QC Forum — That One Change in my Formative Years',
 'A quiet revolution of remembering. On the difference between conceptual happiness and phenomenal happiness — and what it truly means to inhabit life fully rather than merely manage it.',
 'Sep 5, 2024',
 'Quantum Consciousness',
 'Listen',
 'https://img.youtube.com/vi/8ffpq1CsewU/hqdefault.jpg',
 'https://youtu.be/8ffpq1CsewU?si=WUinWrSOBNHLVI9e',
 '["Dharma","Spiritual","Psychology"]',
 8),

('Talk',
 'CESS Talk Series: Ratan Tata''s Leadership — A Modern Reflection of Bharatiya Wisdom in Management',
 'Resource Persons: Shri. Kasi Srinivasan (Former HR Leader, Tata Companies) and Mr. Vinay Kulkarni (Founder & CEO, Alchmi and E-com Elephant).',
 'Jul 11, 2025',
 'Centre for Educational and Social Studies (CESS)',
 'Listen',
 'https://img.youtube.com/vi/GbCtZXkOvg0/hqdefault.jpg',
 'https://youtu.be/GbCtZXkOvg0?si=5uopn7iGUJ1Ml3CL',
 '["CESS","Leadership","Bharatiya Wisdom","Management","Education"]',
 9),

('Panel Discussion',
 'Rediscovering Dharma Through Manusmriti | Panel Discussion with Vinay Kulkarni',
 'This comprehensive exploration of the Manusmriti dismantles centuries of colonial distortion to uncover the authentic principles of Dharmashastra.',
 'Dec 6, 2025',
 'Sangam Talks',
 'Listen',
 'https://img.youtube.com/vi/twm-_Dy9dtI/hqdefault.jpg',
 'https://youtu.be/twm-_Dy9dtI?si=wt76beBmgBPDfptd',
 '["Manusmriti","Dharma","HinduLaw","IKS","SanatanDharma"]',
 10),

('Keynote',
 'Raga Yoga Festival Keynote Speech by Vinay Kulkarni',
 'We are all legally Indian, geographically Indian, but are we truly culturally Indian? The anecdote: 25 children could name every Disney character but couldn''t identify a single Pāṇḍava.',
 'Feb 9, 2026',
 'Upadesha Academy',
 'Listen',
 'https://img.youtube.com/vi/tSv09rVx4tc/hqdefault.jpg',
 'https://youtu.be/tSv09rVx4tc?si=h5xWJtvay50iBBiE',
 '["Raga Yoga","Keynote","IKS","Education","Nation Building"]',
 11),

('Lecture',
 '3rd IKS Certificate Course | NEP 2020 | S3 | Acharya Devo Bhava | NLD',
 'Acharya Devo Bhava: The Sacred Role of the Teacher in Rebuilding Bharat. The aim of this certificate course is to introduce foundational IKS concepts and explore their contemporary relevance.',
 'Nov 26, 2025',
 'Nucleus of Learning and Development',
 'Listen',
 'https://img.youtube.com/vi/HZIIuoTyR2w/hqdefault.jpg',
 'https://youtu.be/HZIIuoTyR2w?si=m9bYgnWcly2U4zo4',
 '["Keynote","IKS","Education","Nation Building"]',
 12),

('Panel Discussion',
 'Integral Education Conclave 2024 — Remembering Sri Aurobindo on his MahaSamadhi Diwas',
 'In this panel conversation, the panelists return to a question modern schooling has stopped asking: what does it actually mean to educate a human being?',
 'Dec 5, 2024',
 'ReTHINK India Institute',
 'Listen',
 'https://img.youtube.com/vi/KDGjoq9fxWo/hqdefault.jpg',
 'https://www.youtube.com/live/KDGjoq9fxWo?si=ubRBsh4yjVchKtEu',
 '["Education","IKS","Dharma"]',
 13),

('Panel Discussion',
 'Navaratri e-Lecture Series 2024: Envisioning a Dharmic Enterprise',
 'A panel conversation exploring the intersection of dharmic principles and modern enterprise, examining how Bhāratīya frameworks can guide purposeful organizational design.',
 'Dec 30, 2024',
 'Centre for Educational and Social Studies (CESS)',
 'Listen',
 'https://img.youtube.com/vi/CU1ngV_uxis/hqdefault.jpg',
 'https://youtu.be/CU1ngV_uxis?si=KRN9p-OuDEe3ON5y',
 '["Education","IKS","Dharma"]',
 14),

('Podcast',
 'Share With Shamantha | Vinay Kulkarni | Spiritual Trainer | ಆಧ್ಯಾತ್ಮ ಅನ್ನೋದು ಇವತ್ತು ಫ್ಯಾಷನ್ ಆಗಿದೆಯೇ?',
 'A conversation on spirituality, dharma, and the distinction between genuine seekers and fashionable spirituality — with Vinay Kulkarni in Kannada.',
 'Jan 25, 2025',
 'Sarathi Communication Development',
 'Listen',
 'https://img.youtube.com/vi/j-529PhyiIA/hqdefault.jpg',
 'https://youtu.be/j-529PhyiIA?si=P_RCMNeQC91fPK8P',
 '["Spirituality","Podcast","IKS"]',
 15);
