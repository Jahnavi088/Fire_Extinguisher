const fs = require('fs');
const path = require('path');

const dir = 'c:/Jahnavi Data/Fire_Extinguisher/src/components/Dashboard';

const files = fs.readdirSync(dir);
for (const file of files) {
  if (file.endsWith('Stats.jsx')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace the entire catch block of the load function.
    // The pattern is:
    // } catch (err) { ... console.error( ... ) ... setSummary({ ... }) ... setAlertsSummary({ ... }) ... setTopAlerts([]); ... } finally {
    // We replace it with a clean zeroed-out block.
    
    // Instead of a complex regex, we can match catch (err) { ... } finally {
    const regex = /catch\s*\([^)]*\)\s*\{[^}]*console\.error[^]*?setTopAlerts\(\[\]\);\s*\}/g;
    
    // Some files might have different variable names for error like catch(err) or catch(e)
    const newCatchBlock = `catch (err) {
      console.error('API Load failed:', err);
      setSummary({ total: 0, active: 0, upcoming: 0, needs_service: 0, expired: 0, due_inspection: 0, readiness_score: 100 });
      setAlertsSummary({ total_alerts: 0, level_1: { count: 0 }, level_2: { count: 0 }, level_3: { count: 0 } });
      setTopAlerts([]);
    }`;

    let newContent = content.replace(regex, newCatchBlock);

    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated ${file}`);
    }
  }
}
