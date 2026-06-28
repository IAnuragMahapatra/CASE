import React from 'react';

export const TeacherManual: React.FC = () => {
  return (
    <div className="manual-content">
      <div style={{ border: '1px solid var(--border-color)', padding: '1rem', marginBottom: '1.5rem', borderRadius: '4px' }}>
        <p style={{ margin: 0, fontWeight: 600 }}>Note on Persistence</p>
        <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>
          Please remember to always save the adjustment plan if you want it to persist. Unsaved plans are discarded.
        </p>
      </div>

      <p>This guide explains how the Class Adjustment and Substitution Engine (CASE) works. The system assigns classes to available teachers based on subject correlation and official designations.</p>

      <h2>1. Understanding the Adjustment Table</h2>
      <p>The adjustment plan utilizes the following columns to indicate the quality of an assignment.</p>

      <h3>Corr. (Subject Correlation)</h3>
      <p>Shows how closely your teaching subject matches the absent teacher's class.</p>
      
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
            <td>Exact subject match.</td>
          </tr>
          <tr>
            <td><strong>SAME_GROUP</strong></td>
            <td>Same subject group (e.g. Physics for a Chemistry class).</td>
          </tr>
          <tr>
            <td><strong>HIGH / MEDIUM</strong></td>
            <td>Related subjects.</td>
          </tr>
          <tr>
            <td><strong>LOW</strong></td>
            <td>Unrelated subject; treated as a pure supervision period.</td>
          </tr>
        </tbody>
      </table>

      <h3>Desig. (Designation Match)</h3>
      <p>Indicates if your official designation formally covers the class.</p>

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
            <td>Class is within your primary designation bounds.</td>
          </tr>
          <tr>
            <td><strong>MISMATCH</strong></td>
            <td>Class is within fallback bounds (used only when no properly designated teacher is available).</td>
          </tr>
        </tbody>
      </table>

      <h3>Notes</h3>
      <p>Logs any soft rules that were relaxed due to teacher unavailability.</p>
      <ul>
        <li><strong>Blank:</strong> A standard assignment.</li>
        <li><code>consecutive (P7 relaxed)</code>: Assigned back-to-back with your regular classes.</li>
        <li><code>over limit (P6 relaxed)</code>: Assigned period pushes your daily total beyond 6.</li>
        <li><code>protected</code>: You are a protected role (e.g. Principal) assigned as a last resort.</li>
      </ul>

      <h2>2. Designation System</h2>
      <p>Classes are assigned based on the following designation limits.</p>

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
            <td><strong>PGT</strong></td>
            <td>Class XI to XII</td>
            <td>Class VI to XII</td>
          </tr>
          <tr>
            <td><strong>TGT</strong></td>
            <td>Class VI to X</td>
            <td>Class III to XII</td>
          </tr>
          <tr>
            <td><strong>PRT</strong></td>
            <td>Class I to V</td>
            <td>Class I to VII</td>
          </tr>
          <tr>
            <td><strong>PPRT</strong></td>
            <td>Nursery, LKG, UKG</td>
            <td>Nursery to Class II</td>
          </tr>
          <tr>
            <td><strong>Staff / Nurse</strong></td>
            <td>Nursery, LKG, UKG</td>
            <td>Nursery, LKG, UKG</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
