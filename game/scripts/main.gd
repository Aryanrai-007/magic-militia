extends Node2D

const PLAYER_SCENE := preload("res://game/scenes/player.tscn")

func _ready() -> void:
	_build_arena()
	_spawn_player(Vector2(640, 500))
	queue_redraw()

func _build_arena() -> void:
	# Four boundary walls.
	_create_platform(Rect2(640, 18, 1232, 36))
	_create_platform(Rect2(640, 702, 1232, 36))
	_create_platform(Rect2(18, 360, 36, 684))
	_create_platform(Rect2(1262, 360, 36, 684))
	# Interior platforms.
	_create_platform(Rect2(150, 410, 210, 24))
	_create_platform(Rect2(1130, 410, 210, 24))
	_create_platform(Rect2(640, 540, 300, 24))
	_create_platform(Rect2(350, 250, 190, 22))
	_create_platform(Rect2(930, 250, 190, 22))
	_create_platform(Rect2(640, 350, 150, 20))

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
	draw_rect(Rect2(0, 0, 1280, 720), Color("#070817"))
	draw_circle(Vector2(640, 310), 420.0, Color("#11152f"))
	draw_circle(Vector2(640, 310), 310.0, Color("#171d3d"))
	# Glowing arena boundary.
	draw_rect(Rect2(40, 40, 1200, 640), Color("#7c3aed"), false, 6.0)
	for p in [Vector2(110,110),Vector2(205,170),Vector2(330,95),Vector2(490,145),Vector2(760,100),Vector2(900,155),Vector2(1080,105),Vector2(1180,180),Vector2(80,560),Vector2(1160,570)]:
		draw_circle(p, 2.5, Color("#c4b5fd"))
	# Interior platforms.
	for rect in [Rect2(45,398,210,24),Rect2(1025,398,210,24),Rect2(490,528,300,24),Rect2(255,239,190,22),Rect2(835,239,190,22),Rect2(565,340,150,20)]:
		draw_rect(rect, Color("#312e81"))
		draw_line(rect.position, Vector2(rect.end.x, rect.position.y), Color("#a78bfa"), 3.0)
