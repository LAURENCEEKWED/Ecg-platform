
# Configurer les Notifications par Email et SMS

## 1. Configurer l'Email (ex: Gmail)

1. Ouvre le fichier `backend/.env`
2. Remplace les valeurs :
   - `EMAIL_USER`: Ton adresse Gmail (ex: monemail@gmail.com)
   - `EMAIL_PASS`: Un "App Password" (pas ton mot de passe normal !)
     - Pour créer un App Password:
       - Allez sur https://myaccount.google.com/security
       - Activez la "Vérification en deux étapes"
       - Créez un "App Password" pour l'application "Mail"
   - `EMAIL_FROM`: "ECG Platform" <tonemail@gmail.com>

## 2. Configurer Twilio pour les SMS

1. Créez un compte Twilio: https://www.twilio.com/try-twilio
2. Obtenez :
   - `TWILIO_ACCOUNT_SID` (sur la console Twilio)
   - `TWILIO_AUTH_TOKEN` (sur la console Twilio)
   - `TWILIO_FROM_NUMBER`: Un numéro Twilio (ex: +1234567890)
3. Remplacez ces valeurs dans `backend/.env`

## 3. Redémarrer le Backend

Après avoir configuré le `.env`, arrêtez le backend et redémarrez-le !
