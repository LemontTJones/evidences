-- Add the following items to ox_inventory/data/items.lua
-- Do not change the item names inside the square brackets
-- You may change the item descriptions and labels of buttons

['evidence_laptop'] = {
	label = 'Kanıt Bilgisayarı',
	description = 'DNA ve parmak izi veritabanına erişim için dizüstü bilgisayar',
	weight = 1500,
	stack = true,
	close = true,
	client = {
		export = 'evidences.evidence_laptop'
	}
},
['evidence_box'] = {
	label = 'Kanıt Kutusu',
	description = 'Kanıtları saklamak için kutu',
	weight = 250,
	stack = false,
	close = false,
	buttons = {{
		label = 'Etiket',
		action = function(slot)
			exports.evidences:evidence_box(slot)
		end
	}}
},
['baggy_empty'] = {
	label = 'Boş Delil Torbası',
	weight = 100,
	stack = true
},
['baggy_blood'] = {
	label = 'Delil Kan',
	weight = 200,
	stack = false
},
['baggy_magazine'] = {
	label = 'Delil Şarjör',
	weight = 200,
	stack = false
},
['hydrogen_peroxide'] = {
	label = 'Parmak İzi Temizleyici',
	weight = 500,
	stack = true,
	client = {
		export = 'evidences.hydrogen_peroxide'
	}
},
['fingerprint_brush'] = {
	label = 'Parmak İzi Fırçası',
	weight = 250,
	stack = true
},
['fingerprint_taken'] = {
	label = 'Delil Parmak İzi',
	weight = 5,
	stack = false
},
['fingerprint_scanner'] = {
	label = 'Parmak İzi Tarayıcısı',
	description = 'Parmak İzlerini Tara',
	weight = 500,
	stack = false,
	close = true,
	consume = 0,
	client = {
		export = 'evidences.fingerprint_scanner',
	},
},
['spy_microphone'] = {
    label = 'Casus Mikrofon',
    description = 'Kişileri dinlemek için mikrofon',
    weight = 1500,
    stack = true,
    close = true,
    client = {
        export = 'evidences.spy_microphone'
    }
},
