extends CharacterBody2D
class_name MagicWizard

signal health_changed(current: float, maximum: float)
signal fuel_changed(current: float, maximum: float)
signal died

@export_category("Movement")
@export var move_speed := 320.0
@export var ground_acceleration := 1800.0
@export var air_acceleration := 1050.0
@export var gravity := 1250.0
@export var max_fall_speed := 850.0
@export var jetpack_acceleration := 1500.0
@export var jetpack_max_fuel := 1.8
@export var jetpack_fuel_burn := 1.0
@export var jetpack_regen := 0.72

@export_category("Combat")
@export var max_health := 100.0
@export var projectile_scene: PackedScene
@export var cast_cooldown := 0.18
@export var melee_cooldown := 0.45
@export var melee_damage := 18.0

var health := max_health
var jetpack_fuel := jetpack_max_fuel
var cast_timer := 0.0
var melee_timer := 0.0
var facing := 1.0
var spawn_position := Vector2.ZERO
var aim_direction := Vector2.RIGHT

func _ready() -> void:
	spawn_position = global_position
	health_changed.emit(health, max_health)
	fuel_changed.emit(jetpack_fuel, jetpack_max_fuel)
	queue_redraw()

func _physics_process(delta: float) -> void:
	if health <= 0.0:
		if Input.is_key_pressed(KEY_R):
			_respawn()
			return
		velocity = Vector2.ZERO
		return

	cast_timer = maxf(cast_timer - delta, 0.0)
	melee_timer = maxf(melee_timer - delta, 0.0)
	_update_movement(delta)
	_update_aim()
	_update_combat()
	move_and_slide()
	queue_redraw()

func _update_movement(delta: float) -> void:
	var axis := 0.0
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT):
		axis -= 1.0
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT):
		axis += 1.0

	if axis != 0.0:
		facing = signf(axis)

	var target_speed := axis * move_speed
	var acceleration := ground_acceleration if is_on_floor() else air_acceleration
	velocity.x = move_toward(velocity.x, target_speed, acceleration * delta)

	var jetpacking := Input.is_key_pressed(KEY_SPACE)
	if jetpacking and jetpack_fuel > 0.0:
		velocity.y = move_toward(velocity.y, -jetpack_acceleration * 0.55, jetpack_acceleration * delta)
		jetpack_fuel = maxf(jetpack_fuel - jetpack_fuel_burn * delta, 0.0)
	else:
		velocity.y = minf(velocity.y + gravity * delta, max_fall_speed)
		if is_on_floor():
			jetpack_fuel = minf(jetpack_fuel + jetpack_regen * delta * 2.0, jetpack_max_fuel)
		else:
			jetpack_fuel = minf(jetpack_fuel + jetpack_regen * delta, jetpack_max_fuel)

	fuel_changed.emit(jetpack_fuel, jetpack_max_fuel)

func _update_aim() -> void:
	var to_mouse := get_global_mouse_position() - global_position
	if to_mouse.length_squared() > 4.0:
		aim_direction = to_mouse.normalized()
		facing = signf(aim_direction.x) if absf(aim_direction.x) > 0.05 else facing

func _update_combat() -> void:
	if Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT) and cast_timer <= 0.0:
		_cast_spark()
		cast_timer = cast_cooldown

	if Input.is_key_pressed(KEY_F) and melee_timer <= 0.0:
		_perform_melee()
		melee_timer = melee_cooldown

func _cast_spark() -> void:
	if projectile_scene == null:
		return
	var projectile := projectile_scene.instantiate()
	projectile.global_position = global_position + aim_direction * 34.0
	projectile.direction = aim_direction
	projectile.owner_id = get_instance_id()
	get_tree().current_scene.add_child(projectile)

func _perform_melee() -> void:
	var space_state := get_world_2d().direct_space_state
	var shape := CircleShape2D.new()
	shape.radius = 52.0
	var query := PhysicsShapeQueryParameters2D.new()
	query.shape = shape
	query.transform = Transform2D(0.0, global_position + aim_direction * 40.0)
	query.collide_with_bodies = true
	query.exclude = [self]
	for result in space_state.intersect_shape(query, 8):
		var body = result.get("collider")
		if body != null and body.has_method("take_damage"):
			body.take_damage(melee_damage, global_position)

func take_damage(amount: float, source_position: Vector2 = global_position) -> void:
	if health <= 0.0:
		return
	health = maxf(health - amount, 0.0)
	var direction := signf(global_position.x - source_position.x)
	velocity += Vector2(direction * 220.0, -180.0)
	health_changed.emit(health, max_health)
	if health <= 0.0:
		died.emit()

func _respawn() -> void:
	global_position = spawn_position
	velocity = Vector2.ZERO
	health = max_health
	jetpack_fuel = jetpack_max_fuel
	health_changed.emit(health, max_health)
	fuel_changed.emit(jetpack_fuel, jetpack_max_fuel)

func _draw() -> void:
	# Placeholder wizard silhouette. Final modular sprites replace this drawing layer.
	draw_circle(Vector2.ZERO, 18.0, Color("#8b5cf6"))
	draw_circle(Vector2(0, -17), 12.0, Color("#f4c7a1"))
	var hat := PackedVector2Array([Vector2(-16, -24), Vector2(0, -48), Vector2(16, -24)])
	draw_colored_polygon(hat, Color("#312e81"))
	var jetpack_color := Color("#f59e0b") if Input.is_key_pressed(KEY_SPACE) and jetpack_fuel > 0 else Color("#64748b")
	draw_circle(Vector2(-10, 18), 5.0, jetpack_color)
	draw_circle(Vector2(10, 18), 5.0, jetpack_color)
	draw_line(Vector2.ZERO, aim_direction * 30.0, Color("#fef3c7"), 5.0)
