{
  lib,
  buildNpmPackage,
}:

buildNpmPackage {
  pname = "markdown-apa7th-docx";
  version = "0.1.0";

  src = ./.;

  npmDepsHash = "sha256-2hG7ezoxJOJRgMOoPurx/QptMuGOv2oV4EjBNFXWuv4=";

  meta = {
    description = "Convert Markdown documents to APA 7th edition formatted DOCX files";
    mainProgram = "md2apa";
    maintainers = with lib.maintainers; [ xddxdd ];
  };
}
