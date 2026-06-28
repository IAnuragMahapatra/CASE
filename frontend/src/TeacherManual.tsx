import React from 'react';

export const TeacherManual: React.FC = () => {
  return (
    <div className="manual-content">
      <div style={{ backgroundColor: 'rgba(255, 170, 0, 0.1)', borderLeft: '4px solid var(--warning-color)', padding: '1rem', marginBottom: '1.5rem', borderRadius: '4px' }}>
        <p style={{ margin: 0, color: 'var(--warning-color)', fontWeight: 600 }}>WARNING</p>
        <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-primary)' }}>
          Please remember to always save the adjustment plan if you want it to persist. If you do not save it it will be deleted.
        </p>
      </div>

      <p>This guide helps you understand how the Class Adjustment and Substitution Engine (CASE) works. The system creates fair and practical substitution plans when teachers are on leave.</p>
      
      <p>When you look at the daily adjustment plan you will see a few specific columns. Here is what they mean and how the system makes decisions.</p>

      <h2>1. Understanding the Adjustment Table</h2>
      <p>The adjustment plan has three special columns: <strong>Corr.</strong>, <strong>Desig.</strong> and <strong>Notes</strong>.</p>

      <h3>🟢 Corr. (Subject Correlation)</h3>
      <p>This shows how closely your teaching subject matches the subject of the absent teacher's class. The system tries to find the best academic match first.</p>
      
      <table>
        <thead>
          <tr>
            <th>Value</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>SAME</strong></td>
            <td>You teach the exact same subject as the absent teacher.</td>
          </tr>
          <tr>
            <td><strong>SAME_GROUP</strong></td>
            <td>You teach a subject in the same Subject Group (for example you teach Physics and the class is Chemistry).</td>
          </tr>
          <tr>
            <td><strong>HIGH</strong></td>
            <td>Your subject is closely related to the class subject.</td>
          </tr>
          <tr>
            <td><strong>MEDIUM</strong></td>
            <td>Your subject has some relation to the class subject.</td>
          </tr>
          <tr>
            <td><strong>LOW</strong></td>
            <td>Your subject is completely unrelated. This is treated as a pure supervision period.</td>
          </tr>
        </tbody>
      </table>

      <h3>🔵 Desig. (Designation Match)</h3>
      <p>This column tells you if your official designation formally covers the class you are substituting for.</p>

      <table>
        <thead>
          <tr>
            <th>Value</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>OK</strong></td>
            <td>Your designation officially covers this class level (for example a PGT taking a Class XI period or a TGT taking a Class VI period).</td>
          </tr>
          <tr>
            <td><strong>MISMATCH</strong></td>
            <td>You are covering a class outside your primary designation boundaries (for example a TGT covering a Class XII period). Note that the system only does this when no properly designated teacher is available.</td>
          </tr>
        </tbody>
      </table>

      <h3>🟡 Notes</h3>
      <p>The system follows strict rules to ensure fairness like not giving you more than 6 periods a day or avoiding back-to-back classes. If the system is forced to break a soft rule because too many teachers are absent it will log the reason here.</p>

      <p><strong>Common Notes:</strong></p>
      <ul>
        <li>Blank: A perfect assignment. No rules were broken.</li>
        <li><code>consecutive (P7 relaxed)</code>: You were assigned a period immediately before or after your own regular classes.</li>
        <li><code>over limit (P6 relaxed)</code>: You were assigned a period that pushes your daily total beyond the preferred maximum of 6 periods.</li>
        <li><code>protected</code>: You are normally excluded from adjustments but were assigned because no one else was free.</li>
      </ul>

      <h2>2. The Designation System</h2>
      <p>The system assigns classes based on official designation limits. A teacher taking classes within their primary bounds gets an <strong>OK</strong> match. If they take a class outside their primary bounds but within their fallback limits it becomes a <strong>MISMATCH</strong>. If a class falls entirely outside the fallback limits the system blocks the assignment.</p>

      <table>
        <thead>
          <tr>
            <th>Designation</th>
            <th>Primary Classes (OK)</th>
            <th>Fallback Classes (MISMATCH)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>PGT (Post Graduate Teacher)</strong></td>
            <td>Classes XI to XII (11 to 12)</td>
            <td>Classes VI to XII (6 to 12)</td>
          </tr>
          <tr>
            <td><strong>TGT (Trained Graduate Teacher)</strong></td>
            <td>Classes VI to X (6 to 10)</td>
            <td>Classes III to XII (3 to 12)</td>
          </tr>
          <tr>
            <td><strong>PRT (Primary Teacher)</strong></td>
            <td>Classes I to V (1 to 5)</td>
            <td>Classes I to VII (1 to 7)</td>
          </tr>
          <tr>
            <td><strong>PPRT (Pre-Primary Teacher)</strong></td>
            <td>Pre-Primary (0)</td>
            <td>Pre-Primary to Class II (0 to 2)</td>
          </tr>
          <tr>
            <td><strong>Staff (Nurse)</strong></td>
            <td>None</td>
            <td>Pre-Primary (0)</td>
          </tr>
        </tbody>
      </table>
      
      <p><em>Note: Pre-Primary (0) includes Nursery, LKG and UKG.</em></p>

      <h3>Protected Teachers and Staff</h3>
      <p>Some teachers and staff members like the Principal, Librarian, Counsellor and general Staff are marked as protected. They stay out of the normal adjustment pools and only get assigned classes when absolutely no one else is free. The New Nurse is not protected and operates in the normal pool but she is strictly limited to covering Pre-Primary classes.</p>

      <h2>3. Subject Groups</h2>
      <p>To ensure students have a productive period during a teacher's absence the system groups related subjects together. If the exact subject teacher is not available CASE will look for someone in the same group.</p>

      <table>
        <thead>
          <tr>
            <th>Subject Group</th>
            <th>Included Subjects</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Science</strong></td>
            <td>Physics, Chemistry, Biology, Computer Science, Science</td>
          </tr>
          <tr>
            <td><strong>Mathematics</strong></td>
            <td>Mathematics</td>
          </tr>
          <tr>
            <td><strong>Social Studies</strong></td>
            <td>History, Geography, Social Science, Economics*</td>
          </tr>
          <tr>
            <td><strong>Commerce</strong></td>
            <td>Commerce, Economics*</td>
          </tr>
          <tr>
            <td><strong>Language</strong></td>
            <td>English, Hindi, Sanskrit, Odia</td>
          </tr>
          <tr>
            <td><strong>Arts & Physical</strong></td>
            <td>Music, Arts, Physical Education</td>
          </tr>
          <tr>
            <td><strong>General</strong></td>
            <td>General, Mother's Teacher</td>
          </tr>
        </tbody>
      </table>
      
      <p><em>*Economics acts as a bridge subject and belongs to both Commerce and Social Studies depending on the teacher.</em></p>

      <h2>4. Fairness and Workload</h2>
      <p>The system is not just about subjects; it also focuses on fairness.</p>
      <ul>
        <li>It tracks how many adjustments you have taken this month.</li>
        <li>If two teachers are equally qualified for a substitution the system will assign the class to the teacher who has taken fewer adjustments this month.</li>
        <li>It actively tries to avoid giving you back-to-back classes or exceeding 6 periods in a single day.</li>
      </ul>
    </div>
  );
};
