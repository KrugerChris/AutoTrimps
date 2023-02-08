//Resetting variables
rShouldBoneShrine = false;
rBSRunningAtlantrimp = false;

function boneShrine() {

	if (!getPageSetting('boneShrineDefaultSettings').active) return;

	const isC3 = game.global.runningChallengeSquared || challengeActive('Mayhem') || challengeActive('Pandemonium') || challengeActive('Desolation');
	const isDaily = challengeActive('Daily');
	const currChall = game.global.challengeActive;
	const shredActive = isDaily && typeof (game.global.dailyChallenge.hemmorrhage) !== 'undefined';
	const shredMods = shredActive ? dailyModifiers.hemmorrhage.getResources(game.global.dailyChallenge.hemmorrhage.strength) : [];

	//Setting up variables
	const rBoneShrineBaseSettings = getPageSetting('boneShrineSettings');
	var rBSIndex = null;
	const totalPortals = getTotalPortals();
	for (var y = 0; y < rBoneShrineBaseSettings.length; y++) {
		const currSetting = rBoneShrineBaseSettings[y];
		if (game.global.world !== currSetting.world || currSetting.done === totalPortals + "_" + game.global.world || !currSetting.active) {
			continue;
		}
		if (currSetting.runType !== 'All') {
			if (!isC3 && !isDaily && (currSetting.runType !== 'Filler' ||
				(currSetting.runType === 'Filler' && (currSetting.challenge !== 'All' && currSetting.challenge !== currChall)))) continue;
			if (isDaily && currSetting.runType !== 'Daily') continue;
			if (isDaily && (currSetting.runType !== 'Daily' ||
				currSetting.shredActive === 'Shred' && (!shredActive || (shredActive && !shredMods.includes(currSetting.gather))) ||
				currSetting.shredActive === 'No Shred' && shredActive && shredMods.includes(currSetting.gather))
			) continue;
			if (isC3 && (currSetting.runType !== 'C3' ||
				(currSetting.runType === 'C3' && (currSetting.challenge3 !== 'All' && currSetting.challenge3 !== currChall)))) continue;
		}
		if (game.global.lastClearedCell + 2 >= currSetting.cell && game.permaBoneBonuses.boosts.charges > currSetting.bonebelow) {
			rBSIndex = y;
			break;
		}
	}
	if (rBSIndex !== null) {
		var rBoneShrineSettings = rBoneShrineBaseSettings[rBSIndex];
		var rBoneShrineCharges = rBoneShrineSettings.boneamount;
		var rBoneShrineGather = rBoneShrineSettings.gather;
		if (challengeActive('Transmute') && rBoneShrineGather === 'metal') rBoneShrineGather = 'food';
		var rBoneShrineSpendBelow = rBoneShrineSettings.bonebelow === -1 ? 0 : rBoneShrineSettings.bonebelow;
		var rBoneShrineAtlantrimp = !game.mapUnlocks.AncientTreasure.canRunOnce ? false : rBoneShrineSettings.atlantrimp;
		var rBoneShrineDoubler = game.global.universe === 2 ? 'Atlantrimp' : 'Trimple Of Doom'

		if (rBoneShrineCharges > game.permaBoneBonuses.boosts.charges - rBoneShrineSpendBelow)
			rBoneShrineCharges = game.permaBoneBonuses.boosts.charges - rBoneShrineSpendBelow;

		setGather(rBoneShrineGather);
		if (getPageSetting('heirloomStaff')) {
			if (getPageSetting('heirloomStaff' + rBoneShrineGather[0].toUpperCase() + rBoneShrineGather.slice(1)) !== 'undefined')
				HeirloomEquipStaff('heirloomStaff' + rBoneShrineGather[0].toUpperCase() + rBoneShrineGather.slice(1));
			else if (getPageSetting('heirloomStaffMap') !== 'undefined')
				HeirloomEquipStaff('heirloomStaffMap');
		}
		if (rBoneShrineAtlantrimp) {
			if (!rBSRunningAtlantrimp) {
				runUniqueMap(rBoneShrineDoubler, false);
			}
			if (shredActive && dailyModifiers.hemmorrhage.getResources(game.global.dailyChallenge.hemmorrhage.strength).includes(rBoneShrineGather) && game.global.mapsActive && game.global.lastClearedMapCell + 1 >= 95 && game.global.hemmTimer < 30 && game.global.lastClearedMapCell !== getCurrentMapObject().size - 2) {
				mapsClicked();
				debug('Pausing ' + rBoneShrineDoubler + ' until shred timer has reset.');
			}
			if (shredActive && dailyModifiers.hemmorrhage.getResources(game.global.dailyChallenge.hemmorrhage.strength).includes(rBoneShrineGather) && game.global.preMapsActive && game.global.currentMapId !== '' && game.global.hemmTimer >= 140) rRunMap();
		}
		if (!rBoneShrineAtlantrimp || (rBoneShrineAtlantrimp && game.global.mapsActive && getCurrentMapObject().name === rBoneShrineDoubler && game.global.lastClearedMapCell === getCurrentMapObject().size - 4)) {
			rShouldBoneShrine = true;
			for (var x = 0; x < rBoneShrineCharges; x++) {
				if (getPageSetting('jobType') > 0) {
					MODULES.mapFunctions.workerRatio = rBoneShrineSettings.jobratio;
					buyJobs();
				}
				game.permaBoneBonuses.boosts.consume();
			}
			debug('Consumed ' + rBoneShrineCharges + " bone shrine " + (rBoneShrineCharges == 1 ? "charge on zone " : "charges on zone ") + game.global.world + " and gained " + boneShrineOutput(rBoneShrineCharges));
			rBoneShrineSettings.done = totalPortals + "_" + game.global.world;
			rBSRunningAtlantrimp = false;
			rShouldBoneShrine = false;
			MODULES.mapFunctions.workerRatio = null;
			saveSettings();
		}
	}
}

function BuySingleRunBonuses() {

	if (!game.singleRunBonuses.goldMaps.owned && game.global.b >= 20 && getPageSetting('c2GoldenMaps'))
		purchaseSingleRunBonus('goldMaps');
	if (!game.singleRunBonuses.sharpTrimps.owned && game.global.b >= 25 && getPageSetting('c2SharpTrimps'))
		purchaseSingleRunBonus('sharpTrimps');
}

function PurchasePerkRespec() {
	//Obtains a respec if one isn't available by buying a bone portal. Be warned will use 100 bones to do so
	if (!game.global.canRespecPerks && game.global.b >= 100) {
		showBones();
		tooltip('Confirm Purchase', null, 'update', 'You are about to purchase one Instant Portal for 100 bones. Your new helium will appear in the View Perks menu at the bottom of the screen. Is this what you wanted to do?', 'purchaseMisc(\'helium\')', 100);
		hideBones();
		debug("Bone portal respec purchased");
	}
}

function PandemoniumPerkRespec() {
	//Setting up pandGoal variable.
	pandGoal = typeof (pandGoal) == 'undefined' && getPageSetting('rPandRespecZone') == -1 ? "NEG" :
		typeof (pandGoal) == 'undefined' && game.global.world < getPageSetting('rPandRespecZone') ? 0 :
			typeof (pandGoal) == 'undefined' && game.challenges.Pandemonium.pandemonium > 0 ? "destacking" :
				typeof (pandGoal) == 'undefined' && game.challenges.Pandemonium.pandemonium == 0 && game.upgrades.Speedminer.done == game.global.world ? "jestFarm" :
					typeof (pandGoal) == 'undefined' ? 0 :
						pandGoal;

	if (getPageSetting('rPandRespecZone') != -1 && getPageSetting('rPandRespecZone') <= game.global.world && getPageSetting('pandemoniumAE') > 1 &&
		getPageSetting('pandemoniumStaff') != "undefined" && (game.global.StaffEquipped.name == getPageSetting('pandemoniumStaff') || HeirloomSearch('pandemoniumStaff') != undefined) &&
		(getPageSetting('pandemoniumAEZone') > 5 && game.global.world >= getPageSetting('pandemoniumAEZone')) &&
		(getPageSetting('pandemoniumZone') > 5 && game.global.world >= getPageSetting('pandemoniumZone'))) {
		//Purchases a respec if one isn't currently available.
		if (!game.global.canRespecPerks && game.global.world < 150) {
			PurchasePerkRespec();
		}

		//Respecs to preset 2 if you're currently destacking.
		if (rShouldPandemoniumDestack) {
			if (pandGoal != "destacking") {
				PerkRespec(2)
				pandGoal = "destacking";
			}
		}

		//Respecs to preset 3 if you should equip farm.
		if (game.challenges.Pandemonium.pandemonium == 0 && game.upgrades.Speedminer.done == game.global.world) {
			if (pandGoal != "jestFarm") {
				PerkRespec(3)
				pandGoal = "jestFarm";
				savefile = null;
			}
		}
	}
}
