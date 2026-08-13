extends CanvasLayer

var player: MagicWizard
var hp_bar: ProgressBar
var fuel_bar: ProgressBar
var status_label: Label

func _ready() -> void:
	hp_bar = $MarginContainer/VBoxContainer/HP
	fuel_bar = $MarginContainer/VBoxContainer/Fuel
	status_label = $MarginContainer/VBoxContainer/Status

func _process(_delta: float) -> void:
	if not is_instance_valid(player):
		var players := get_tree().get_nodes_in_group("players")
		if not players.is_empty():
			player = players[0]
		if player == null:
			return

	hp_bar.max_value = player.max_health
	hp_bar.value = player.health
	fuel_bar.max_value = player.jetpack_max_fuel
	fuel_bar.value = player.jetpack_fuel
	status_label.text = "ALIVE  •  Spark Wand equipped" if player.health > 0.0 else "DEFEATED  •  Press R to respawn"
