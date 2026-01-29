# Network Cartographer - Translation Glossary

This glossary ensures consistent terminology across all translations (EN/LV/RU).

## Terms That Should NOT Be Translated

These technical terms should remain in English across all locales per i18n best practices:

### Network Terminology

| Term       | Reason                                        |
| ---------- | --------------------------------------------- |
| IP         | Internet Protocol - universal abbreviation    |
| MAC        | Media Access Control - universal abbreviation |
| TCP        | Transmission Control Protocol                 |
| UDP        | User Datagram Protocol                        |
| HTTP/HTTPS | Hypertext Transfer Protocol (Secure)          |
| DNS        | Domain Name System                            |
| NAT        | Network Address Translation                   |
| Wi-Fi      | Wireless Fidelity - brand name                |
| LAN/WAN    | Local/Wide Area Network                       |
| SSH        | Secure Shell                                  |
| TLS/SSL    | Transport Layer Security                      |
| ISP        | Internet Service Provider                     |
| API        | Application Programming Interface             |

### Protocol/Service Names

| Term     | Reason                        |
| -------- | ----------------------------- |
| SSH      | Protocol name                 |
| FTP/SFTP | File Transfer Protocol        |
| SMTP     | Simple Mail Transfer Protocol |
| RTSP     | Real Time Streaming Protocol  |

## Terms That SHOULD Be Translated

### UI Elements

| English     | Latvian      | Russian         |
| ----------- | ------------ | --------------- |
| Router      | Maršrutētājs | Маршрутизатор   |
| Device      | Ierīce       | Устройство      |
| Network     | Tīkls        | Сеть            |
| Layer       | Slānis       | Слой            |
| Port        | Ports        | Порт            |
| Connection  | Savienojums  | Соединение      |
| Encrypted   | Šifrēts      | Зашифрованный   |
| Unencrypted | Nešifrēts    | Незашифрованный |

### Network Zones

| English       | Latvian         | Russian       |
| ------------- | --------------- | ------------- |
| Main Network  | Galvenais tīkls | Основная сеть |
| Guest Network | Viesu tīkls     | Гостевая сеть |
| IoT Network   | IoT tīkls       | Сеть IoT      |

### OSI Layers

| English           | Latvian                  | Russian              |
| ----------------- | ------------------------ | -------------------- |
| Link Layer        | Saites slānis            | Канальный уровень    |
| Network Layer     | Tīkla slānis             | Сетевой уровень      |
| Transport Layer   | Transporta slānis        | Транспортный уровень |
| Application Layer | Lietojumprogrammu slānis | Прикладной уровень   |

### Actions

| English     | Latvian    | Russian       |
| ----------- | ---------- | ------------- |
| Investigate | Izmeklēt   | Расследовать  |
| Block       | Bloķēt     | Заблокировать |
| Ignore      | Ignorēt    | Игнорировать  |
| Start       | Sākt       | Начать        |
| Pause       | Pauze      | Пауза         |
| Reset       | Atiestatīt | Сбросить      |
| Close       | Aizvērt    | Закрыть       |

### Device Types

| English    | Latvian        | Russian         |
| ---------- | -------------- | --------------- |
| Laptop     | Klēpjdators    | Ноутбук         |
| Phone      | Telefons       | Телефон         |
| Tablet     | Planšetdators  | Планшет         |
| Smart TV   | Viedtelevizors | Умный телевизор |
| Camera     | Kamera         | Камера          |
| Thermostat | Termostats     | Термостат       |
| Speaker    | Skaļrunis      | Колонка         |
| Printer    | Printeris      | Принтер         |
| Unknown    | Nezināms       | Неизвестный     |

## Translation Guidelines

1. **Be consistent** - Use the same translation for a term throughout the app
2. **Context matters** - "Network" in "Network Cartographer" stays English (product name)
3. **Technical accuracy** - Prefer accuracy over colloquial terms
4. **Readability** - Use common terms familiar to target audience
5. **Abbreviations** - Keep technical abbreviations in English

## Update Process

1. When adding new terms, update this glossary first
2. Run `node scripts/i18n-validate.js` to check for missing translations
3. Submit translations for native speaker review before merging

## Ownership

Translation quality sign-off: Product Manager or designated native reviewer
