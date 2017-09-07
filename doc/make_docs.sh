#!/bin/sh
pandoc -o services.docx -f markdown -t docx README_services.md
pandoc -o ihm.docx -f markdown -t docx README_ihm.md
pandoc README_services.md --latex-engine=xelatex -o services.pdf
pandoc README_ihm.md --latex-engine=xelatex -o ihm.pdf