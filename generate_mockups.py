# -*- coding: utf-8 -*-
"""Generate SVG mockups showing visual layout of the 3 screens."""

svg_screen_quiz = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 620" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f0f4ff"/>
      <stop offset="50%" stop-color="#e6eaf8"/>
      <stop offset="100%" stop-color="#fdf4f5"/>
    </linearGradient>
    <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0f172a" flood-opacity="0.08"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="800" height="620" fill="url(#bg)"/>

  <!-- Top Navigation Bar -->
  <rect width="800" height="54" fill="#ffffff" fill-opacity="0.9" border-bottom="1px solid #e2e8f0"/>
  <line x1="0" y1="54" x2="800" y2="54" stroke="#e2e8f0" stroke-width="1"/>
  
  <rect x="30" y="12" width="30" height="30" rx="8" fill="#4f46e5"/>
  <text x="45" y="32" font-family="'Segoe UI', sans-serif" font-size="16" fill="#ffffff" text-anchor="middle" font-weight="bold">📚</text>
  <text x="70" y="28" font-family="'Segoe UI', sans-serif" font-size="14" fill="#1e293b" font-weight="bold">BizExam Reviewer</text>
  <text x="70" y="42" font-family="'Segoe UI', sans-serif" font-size="10" fill="#64748b">การประกอบธุรกิจ ม.5 (50 ข้อ)</text>

  <!-- Upper Live Stats Bar -->
  <rect y="54" width="800" height="42" fill="#ffffff" fill-opacity="0.98"/>
  <line x1="0" y1="96" x2="800" y2="96" stroke="#e2e8f0" stroke-width="1"/>

  <!-- Stat Pills -->
  <!-- Correct Pill -->
  <rect x="30" y="62" width="80" height="26" rx="13" fill="#ecfdf5" stroke="#10b981" stroke-opacity="0.3"/>
  <text x="70" y="79" font-family="'Segoe UI', sans-serif" font-size="11" fill="#059669" font-weight="bold" text-anchor="middle">✓ ถูก: 8</text>

  <!-- Wrong Pill -->
  <rect x="120" y="62" width="80" height="26" rx="13" fill="#fef2f2" stroke="#ef4444" stroke-opacity="0.3"/>
  <text x="160" y="79" font-family="'Segoe UI', sans-serif" font-size="11" fill="#dc2626" font-weight="bold" text-anchor="middle">✗ ผิด: 2</text>

  <!-- Progress Bar Track -->
  <rect x="220" y="71" width="360" height="8" rx="4" fill="#e2e8f0"/>
  <rect x="220" y="71" width="180" height="8" rx="4" fill="url(#primaryGrad)"/>

  <!-- Timer & Progress Counter -->
  <rect x="600" y="62" width="75" height="26" rx="6" fill="#f1f5f9"/>
  <text x="637" y="79" font-family="'Segoe UI', monospace" font-size="11" fill="#334155" font-weight="bold" text-anchor="middle">⏱ 04:15</text>

  <rect x="685" y="62" width="85" height="26" rx="6" fill="#eef2ff" stroke="#c7d2fe"/>
  <text x="727" y="79" font-family="'Segoe UI', sans-serif" font-size="11" fill="#4f46e5" font-weight="bold" text-anchor="middle">ข้อ 10 / 20</text>

  <!-- Question Card Container -->
  <rect x="50" y="118" width="700" height="470" rx="18" fill="#ffffff" filter="url(#shadow)" stroke="#e2e8f0"/>

  <!-- Badges -->
  <rect x="80" y="142" width="165" height="22" rx="6" fill="#eef2ff"/>
  <text x="162" y="157" font-family="'Segoe UI', sans-serif" font-size="10" fill="#4f46e5" font-weight="bold" text-anchor="middle">ชุดที่ 1: พื้นฐานการประกอบธุรกิจ</text>

  <rect x="255" y="142" width="90" height="22" rx="6" fill="#dcfce7"/>
  <text x="300" y="157" font-family="'Segoe UI', sans-serif" font-size="10" fill="#15803d" font-weight="bold" text-anchor="middle">🟢 ง่าย (พื้นฐาน)</text>

  <text x="710" y="158" font-family="'Segoe UI', sans-serif" font-size="11" fill="#64748b" text-anchor="end">☆ ติดดาว</text>

  <!-- Question Title -->
  <text x="80" y="195" font-family="'Segoe UI', sans-serif" font-size="16" fill="#0f172a" font-weight="bold">
    ข้อที่ 2. ข้อใดคือเกณฑ์สำคัญในการพิจารณาว่าองค์กรธุรกิจใดเป็น 'รัฐวิสาหกิจ'?
  </text>

  <!-- Choices -->
  <!-- Choice 1 -->
  <rect x="80" y="220" width="640" height="42" rx="10" fill="#ffffff" stroke="#e2e8f0"/>
  <rect x="90" y="228" width="26" height="26" rx="6" fill="#f1f5f9"/>
  <text x="103" y="246" font-family="'Segoe UI', sans-serif" font-size="12" fill="#64748b" font-weight="bold" text-anchor="middle">ก</text>
  <text x="130" y="246" font-family="'Segoe UI', sans-serif" font-size="13" fill="#334155">มีระบบการบริหารงานแบบราชการเต็มรูปแบบ</text>

  <!-- Choice 2 (Correct & Highlighted) -->
  <rect x="80" y="272" width="640" height="42" rx="10" fill="#ecfdf5" stroke="#10b981" stroke-width="2"/>
  <rect x="90" y="280" width="26" height="26" rx="6" fill="#10b981"/>
  <text x="103" y="298" font-family="'Segoe UI', sans-serif" font-size="12" fill="#ffffff" font-weight="bold" text-anchor="middle">ข</text>
  <text x="130" y="298" font-family="'Segoe UI', sans-serif" font-size="13" fill="#065f46" font-weight="bold">ส่วนราชการถือหุ้นในกิจการนั้นเกินกว่าร้อยละ 50  ✓ (ถูกต้อง)</text>

  <!-- Choice 3 -->
  <rect x="80" y="324" width="640" height="42" rx="10" fill="#ffffff" stroke="#e2e8f0"/>
  <rect x="90" y="332" width="26" height="26" rx="6" fill="#f1f5f9"/>
  <text x="103" y="350" font-family="'Segoe UI', sans-serif" font-size="12" fill="#64748b" font-weight="bold" text-anchor="middle">ค</text>
  <text x="130" y="350" font-family="'Segoe UI', sans-serif" font-size="13" fill="#334155">จัดตั้งขึ้นเพื่อแสวงหากำไรสูงสุดให้แก่ผู้ถือหุ้นเอกชน</text>

  <!-- Choice 4 -->
  <rect x="80" y="376" width="640" height="42" rx="10" fill="#ffffff" stroke="#e2e8f0"/>
  <rect x="90" y="384" width="26" height="26" rx="6" fill="#f1f5f9"/>
  <text x="103" y="402" font-family="'Segoe UI', sans-serif" font-size="12" fill="#64748b" font-weight="bold" text-anchor="middle">ง</text>
  <text x="130" y="402" font-family="'Segoe UI', sans-serif" font-size="13" fill="#334155">จดทะเบียนจัดตั้งตามพระราชบัญญัติสหกรณ์</text>

  <!-- Explanation Box -->
  <rect x="80" y="430" width="640" height="70" rx="10" fill="#f0f9ff" stroke="#0284c7" stroke-width="1.5"/>
  <line x1="80" y1="430" x2="80" y2="500" stroke="#0284c7" stroke-width="6"/>
  <text x="96" y="450" font-family="'Segoe UI', sans-serif" font-size="11" fill="#0369a1" font-weight="bold">💡 คำอธิบายเฉลยละเอียด:</text>
  <text x="96" y="472" font-family="'Segoe UI', sans-serif" font-size="11.5" fill="#1e293b">รัฐวิสาหกิจคือองค์กรที่รัฐเป็นเจ้าของ หรือบริษัท/ห้างหุ้นส่วนนิติบุคคลที่ส่วนราชการถือหุ้นเกินกว่าร้อยละ 50</text>
  <text x="96" y="488" font-family="'Segoe UI', sans-serif" font-size="11.5" fill="#1e293b">และบริหารแบบกึ่งราชการและธุรกิจ</text>

  <!-- Bottom Nav Buttons -->
  <rect x="80" y="520" width="120" height="38" rx="8" fill="#f8fafc" stroke="#cbd5e1"/>
  <text x="140" y="544" font-family="'Segoe UI', sans-serif" font-size="12" fill="#475569" font-weight="600" text-anchor="middle">← ข้อก่อนหน้า</text>

  <rect x="600" y="520" width="120" height="38" rx="8" fill="url(#primaryGrad)"/>
  <text x="660" y="544" font-family="'Segoe UI', sans-serif" font-size="12" fill="#ffffff" font-weight="600" text-anchor="middle">ข้อถัดไป →</text>
</svg>
"""

svg_screen_result = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 620" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f0f4ff"/>
      <stop offset="50%" stop-color="#e6eaf8"/>
      <stop offset="100%" stop-color="#fdf4f5"/>
    </linearGradient>
    <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
    <linearGradient id="retryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0f172a" flood-opacity="0.08"/>
    </filter>
  </defs>

  <rect width="800" height="620" fill="url(#bg)"/>

  <!-- Top Bar -->
  <rect width="800" height="54" fill="#ffffff" fill-opacity="0.9"/>
  <line x1="0" y1="54" x2="800" y2="54" stroke="#e2e8f0" stroke-width="1"/>
  <text x="45" y="34" font-family="'Segoe UI', sans-serif" font-size="16" fill="#4f46e5" font-weight="bold">📊 BizExam Review - ผลคะแนนการทดสอบ</text>

  <!-- Result Main Card -->
  <rect x="60" y="80" width="680" height="510" rx="20" fill="#ffffff" filter="url(#shadow)" stroke="#e2e8f0"/>

  <!-- Title -->
  <text x="400" y="125" font-family="'Segoe UI', sans-serif" font-size="20" fill="#0f172a" font-weight="bold" text-anchor="middle">🎉 ยอดเยี่ยมมาก! ทำคะแนนได้ในเกณฑ์ดี</text>
  <text x="400" y="148" font-family="'Segoe UI', sans-serif" font-size="12" fill="#64748b" text-anchor="middle">คุณพร้อมสำหรับการสอบจริงแล้ว แต่สามารถกดฝึกซ้ำข้อที่พลาดเพื่อให้ได้ 100% เต็มได้</text>

  <!-- Circle Progress Meter -->
  <circle cx="400" cy="225" r="55" fill="none" stroke="#f1f5f9" stroke-width="10"/>
  <circle cx="400" cy="225" r="55" fill="none" stroke="#10b981" stroke-width="10" stroke-dasharray="345" stroke-dashoffset="69" stroke-linecap="round" transform="rotate(-90 400 225)"/>
  <text x="400" y="222" font-family="'Segoe UI', sans-serif" font-size="26" fill="#0f172a" font-weight="bold" text-anchor="middle">16/20</text>
  <text x="400" y="242" font-family="'Segoe UI', sans-serif" font-size="13" fill="#10b981" font-weight="bold" text-anchor="middle">80% ผ่านเกณฑ์</text>

  <!-- 4 Metric Cards -->
  <rect x="100" y="295" width="135" height="65" rx="10" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="167" y="325" font-family="'Segoe UI', sans-serif" font-size="20" fill="#059669" font-weight="bold" text-anchor="middle">16</text>
  <text x="167" y="345" font-family="'Segoe UI', sans-serif" font-size="10" fill="#64748b" text-anchor="middle">ข้อที่ตอบถูก</text>

  <rect x="250" y="295" width="135" height="65" rx="10" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="317" y="325" font-family="'Segoe UI', sans-serif" font-size="20" fill="#dc2626" font-weight="bold" text-anchor="middle">4</text>
  <text x="317" y="345" font-family="'Segoe UI', sans-serif" font-size="10" fill="#64748b" text-anchor="middle">ข้อที่ตอบผิด</text>

  <rect x="400" y="295" width="135" height="65" rx="10" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="467" y="325" font-family="'Segoe UI', sans-serif" font-size="20" fill="#4f46e5" font-weight="bold" text-anchor="middle">80%</text>
  <text x="467" y="345" font-family="'Segoe UI', sans-serif" font-size="10" fill="#64748b" text-anchor="middle">อัตราความแม่นยำ</text>

  <rect x="550" y="295" width="135" height="65" rx="10" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="617" y="325" font-family="'Segoe UI', sans-serif" font-size="18" fill="#334155" font-weight="bold" text-anchor="middle">08m 12s</text>
  <text x="617" y="345" font-family="'Segoe UI', sans-serif" font-size="10" fill="#64748b" text-anchor="middle">เวลาที่ใช้</text>

  <!-- Special Feature: Retry Wrong Questions Button -->
  <rect x="180" y="380" width="440" height="46" rx="12" fill="url(#retryGrad)"/>
  <text x="400" y="409" font-family="'Segoe UI', sans-serif" font-size="14" fill="#ffffff" font-weight="bold" text-anchor="middle">
    🔁 ทำซ้ำเฉพาะข้อที่ผิด (Retry 4 Wrong Questions)
  </text>

  <!-- Secondary Buttons -->
  <rect x="180" y="440" width="210" height="38" rx="10" fill="#f1f5f9" stroke="#cbd5e1"/>
  <text x="285" y="464" font-family="'Segoe UI', sans-serif" font-size="12" fill="#334155" font-weight="600" text-anchor="middle">🔄 ทำใหม่ทั้งหมด (Retry All)</text>

  <rect x="410" y="440" width="210" height="38" rx="10" fill="#f1f5f9" stroke="#cbd5e1"/>
  <text x="515" y="464" font-family="'Segoe UI', sans-serif" font-size="12" fill="#334155" font-weight="600" text-anchor="middle">⚙️ ตั้งค่าระดับความยากใหม่</text>

  <!-- Bottom Review Header -->
  <text x="400" y="520" font-family="'Segoe UI', sans-serif" font-size="12" fill="#64748b" text-anchor="middle">
    👇 เลื่อนลงด้านล่างเพื่ออ่านเฉลยละเอียดและวิเคราะห์ข้อสอบทุกข้อ
  </text>
</svg>
"""

with open("ui_mockup_quiz.svg", "w", encoding="utf-8") as f:
    f.write(svg_screen_quiz)

with open("ui_mockup_result.svg", "w", encoding="utf-8") as f:
    f.write(svg_screen_result)

print("Generated ui_mockup_quiz.svg and ui_mockup_result.svg")
