
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Add()
$selection = $word.Selection

$selection.Style = "Title"
$selection.TypeText("SOS Emergency Safety Platform - API Documentation")
$selection.TypeParagraph()

$selection.Style = "Heading 1"
$selection.TypeText("1. Authentication APIs")
$selection.TypeParagraph()
$selection.Style = "Normal"
$selection.TypeText("Endpoints: /auth/login, /auth/me, /auth/logout")
$selection.TypeParagraph()

$selection.Style = "Heading 1"
$selection.TypeText("2. Administrative Suite")
$selection.TypeParagraph()
$selection.Style = "Normal"
$selection.TypeText("User Management: /admin/users (GET POST PATCH DELETE)")
$selection.TypeParagraph()
$selection.TypeText("Navigation Access: /admin/users/:id/nav-access (GET PUT)")
$selection.TypeParagraph()
$selection.TypeText("Module Permissions: /admin/users/:id/modules (GET POST DELETE)")
$selection.TypeParagraph()

$selection.Style = "Heading 1"
$selection.TypeText("3. Equipment and Operations")
$selection.TypeParagraph()
$selection.Style = "Normal"
$selection.TypeText("Dashboard: /dashboard")
$selection.TypeParagraph()
$selection.TypeText("Equipment: /equipment (GET POST PUT DELETE)")
$selection.TypeParagraph()

$doc.SaveAs("c:\Users\User\Desktop\Fire_Extinguisher\docs\sos.docx")
$doc.Close()
$word.Quit()
