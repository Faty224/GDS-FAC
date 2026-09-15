"C:\Program Files\Git\cmd\git.exe" init
"C:\Program Files\Git\cmd\git.exe" config user.name "Faty224"
"C:\Program Files\Git\cmd\git.exe" config user.email "faty@gds.gn"
"C:\Program Files\Git\cmd\git.exe" add .
"C:\Program Files\Git\cmd\git.exe" commit -m "Initial commit - GDS Facture"
"C:\Program Files\Git\cmd\git.exe" branch -M debut
"C:\Program Files\Git\cmd\git.exe" remote remove origin
"C:\Program Files\Git\cmd\git.exe" remote add origin https://github.com/Faty224/GDS-FAC.git
"C:\Program Files\Git\cmd\git.exe" push -u origin debut
