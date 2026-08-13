extends Node2D

const PLAYER_SCENE := preload("res://game/scenes/player.tscn")

func _ready() -> void:
	_build_arena()
	_spawn_player(Vector2(640, 460))
	queue_redraw()

func _build_arena() -> void:
	_create_platform(Rect2(640, 680, 1280, 80))
	_create_platform(Rect2(80, 360, 160, 28))
	_create_platform(Rect2(1200, 360, 160, 28))
	_create_platform(Rect2(640, 500, 260, 24))
	_create_platform(Rect2(350, 230, 180, 22))
	_create_platform(Rect2(930, 230, 180, 22))

func _create_platform(rect: Rect2) -> void:
	var body := StaticBody2D.new()
	body.position = rect.position
	var collision := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = rect.size
	collision.shape = shape
	body.add_child(collision)
	add_child(body)

func _spawn_player(at: Vector2) -> void:
	var player := PLAYER_SCENE.instantiate()
	player.position = at
	add_child(player)

func _draw() -> void:
	draw_rect(Rect2(0, 0, 1280, 720), Color("#090b1a"))
	# Soft arena backdrop.
	draw_circle(Vector2(640, 300), 360.0, Color("#111827"))
	draw_circle(Vector2(640, 300), 250.0, Color("#171d35"))
	# Platform visuals match the collision layout.
	for rect in [
		Rect2(0, 640, 1280, 80),
		Rect2(0, 346, 160, 28),
		Rect2(1120, 346, 160, 28),
		Rect2(510, 488, 260, 24),
		Rect2(260, 219, 180, 22),
		Rect2(840, 219, 180, 22)
	]:
		draw_rect(rect, Color("#334155"))
		draw_line(rect.position, Vector2(rect.end.x, rect.position.y), Color("#64748b"), 2.0)
