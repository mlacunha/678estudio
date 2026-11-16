Option Explicit

Dim fso, shell, appDir, rootDir, nodeExe, launcherJs, localAppData, errFile, cmd, exitCode, msg
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

appDir = fso.GetParentFolderName(WScript.ScriptFullName)
rootDir = fso.GetParentFolderName(appDir)
nodeExe = fso.BuildPath(rootDir, "runtime\node.exe")
launcherJs = fso.BuildPath(appDir, "launcher.mjs")

If Not fso.FileExists(nodeExe) Then
  MsgBox "Runtime Node.js não encontrado em:" & vbCrLf & nodeExe & vbCrLf & vbCrLf & "Reinstale o aplicativo 678 Estudio Mockups Comerciais.", vbCritical, "678 Estudio — Mockups Comerciais"
  WScript.Quit 1
End If

localAppData = shell.ExpandEnvironmentStrings("%LOCALAPPDATA%")
errFile = localAppData & "\678Estudio-Mockups\launcher-error.txt"
If fso.FileExists(errFile) Then On Error Resume Next: fso.DeleteFile errFile, True: On Error GoTo 0

cmd = """" & nodeExe & """ """ & launcherJs & """"
exitCode = shell.Run(cmd, 0, True)

If exitCode <> 0 Then
  msg = "Não foi possível iniciar o Gerador de Mockups Comerciais."
  If fso.FileExists(errFile) Then
    msg = msg & vbCrLf & vbCrLf & fso.OpenTextFile(errFile, 1).ReadAll()
  End If
  MsgBox msg, vbCritical, "678 Estudio — Mockups Comerciais"
  WScript.Quit exitCode
End If
