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
@export var melee_cooldown := 0.55
@export var melee_damage := 25.0

var health := max_health
var jetpack_fuel := jetpack_max_fuel
var cast_timer := 0.0
var melee_timer := 0.0
var melee_flash := 0.0
var spawn_position := Vector2.ZERO
var aim_direction := Vector2.RIGHT

func _ready() -> void:
	spawn_position = global_position
	health_changed.emit(health, max_health)
	fuel_changed.emit(jetpack_fuel, jetpack_max_fuel)

func _physics_process(delta: float) -> void:
	if health <= 0.0:
		velocity = Vector2.ZERO
		if Input.is_action_just_pressed("reset"):
			_respawn()
		return
	cast_timer = maxf(cast_timer - delta, 0.0)
	melee_timer = maxf(melee_timer - delta, 0.0)
	melee_flash = maxf(melee_flash - delta, 0.0)
	_update_movement(delta)
	_update_aim()
	_update_combat()
	move_and_slide()
	queue_redraw()

func _update_movement(delta: float) -> void:
	var axis := Input.get_axis("move_left", "move_right")
	velocity.x = move_toward(velocity.x, axis * move_speed, (ground_acceleration if is_on_floor() else air_acceleration) * delta)
	if Input.is_action_pressed("jetpack") and jetpack_fuel > 0.0:
		velocity.y = move_toward(velocity.y, -jetpack_acceleration * 0.55, jetpack_acceleration * delta)
		jetpack_fuel = maxf(jetpack_fuel - jetpack_fuel_burn * delta, 0.0)
	else:
		velocity.y = minf(velocity.y + gravity * delta, max_fall_speed)
		jetpack_fuel = minf(jetpack_fuel + jetpack_regen * (2.0 if is_on_floor() else 1.0) * delta, jetpack_max_fuel)
	fuel_changed.emit(jetpack_fuel, jetpack_max_fuel)

func _update_aim() -> void:
	var to_mouse := get_global_mouse_position() - global_position
	if to_mouse.length_squared() > 4.0:
		aim_direction = to_mouse.normalized()

func _update_combat() -> void:
	if Input.is_action_pressed("cast") and cast_timer <= 0.0:
		_cast_spark()
		cast_timer = cast_cooldown
	if Input.is_action_just_pressed("melee") and melee_timer <= 0.0:
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
	melee_flash = 0.16
	var query := PhysicsShapeQueryParameters2D.new()
	var shape := CircleShape2D.new()
	shape.radius = 58.0
	query.shape = shape
	query.transform = Transform2D(0.0, global_position + aim_direction * 42.0)
	query.collide_with_bodies = true
	query.exclude = [self]
	for result in get_world_2d().direct_space_state.intersect_shape(query, 16):
		var body = result.get("collider")
		if body != null and body.has_method("take_damage"):
			body.take_damage(melee_damage, global_position)
			if body is CharacterBody2D:
				body.velocity += aim_direction * 420.0 + Vector2(0, -100)

func take_damage(amount: float, source_position: Vector2 = global_position) -> void:
	if health <= 0.0:
		return
	health = maxf(health - amount, 0.0)
	velocity += Vector2(signf(global_position.x - source_position.x) * 220.0, -180.0)
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
	if melee_flash > 0.0:
		var alpha := melee_flash / 0.16
		draw_arc(aim_direction * 38.0, 42.0, -1.15, 1.15, 20, Color(0.76, 0.55, 1.0, alpha), 8.0)
		draw_circle(aim_direction * 38.0, 10.0, Color(0.93, 0.82, 1.0, alpha))
