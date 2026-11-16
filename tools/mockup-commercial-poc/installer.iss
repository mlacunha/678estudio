#ifndef AppVersion
  #define AppVersion "1.0.0"
#endif
#ifndef StagingDir
  #define StagingDir "staging"
#endif

[Setup]
AppId={{678ESTUDIO-MOCKUPS-008C3}}
AppName=678 Estudio Mockups Comerciais
AppVersion={#AppVersion}
AppPublisher=678 Estudio
DefaultDirName={localappdata}\Programs\678Estudio-Mockups
DefaultGroupName=678 Estudio Mockups Comerciais
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputBaseFilename=678Estudio-Mockups-Setup-{#AppVersion}-x64
Compression=lzma2/normal
SolidCompression=yes
WizardStyle=modern
UninstallDisplayName=678 Estudio Mockups Comerciais

[Languages]
Name: "portuguese"; MessagesFile: "compiler:Languages\Portuguese.isl"
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Tasks]
Name: "desktopicon"; Description: "Criar atalho na Área de Trabalho"; GroupDescription: "Atalhos adicionais:"; Flags: unchecked

[Dirs]
Name: "{localappdata}\678Estudio-Mockups"; Flags: uninsneveruninstall
Name: "{localappdata}\678Estudio-Mockups\originais"; Flags: uninsneveruninstall
Name: "{localappdata}\678Estudio-Mockups\artes-teste"; Flags: uninsneveruninstall
Name: "{localappdata}\678Estudio-Mockups\resultados"; Flags: uninsneveruninstall
Name: "{localappdata}\678Estudio-Mockups\temporarios"; Flags: uninsneveruninstall

[Files]
Source: "{#StagingDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\678 Estudio Mockups Comerciais"; Filename: "wscript.exe"; Parameters: """{app}\app\iniciar.vbs"""; WorkingDir: "{app}\app"
Name: "{autodesktop}\678 Estudio Mockups Comerciais"; Filename: "wscript.exe"; Parameters: """{app}\app\iniciar.vbs"""; WorkingDir: "{app}\app"; Tasks: desktopicon

[Run]
Filename: "wscript.exe"; Parameters: """{app}\app\iniciar.vbs"""; Description: "Iniciar o 678 Estudio Mockups Comerciais agora"; Flags: nowait postinstall skipifsilent
