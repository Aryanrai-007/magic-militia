extends Area2D
class_name SparkProjectile

@export var speed := 820.0
@export var damage := 12.0
@export var lifetime := 1.5
@export var knockback := 180.0

var direction := Vector2.RIGHT
var owner_id := 0
var age := 0.0

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	queue_redraw()

func _physics_process(delta: float) -> void:
	age += delta
	position += direction * speed * delta
	if age >= lifetime:
		queue_free()
	queue_redraw()

func _on_body_entered(body: Node) -> void:
	if body.get_instance_id() == owner_id:
		return
	if body.has_method("take_damage"):
		body.take_damage(damage, global_position - direction * 10.0)
		if "velocity" in body:
			body.velocity += direction * knockback
	queue_free()

func _draw() -> void:
	draw_circle(Vector2.ZERO, 7.0, Color("#fbbf24"))
	draw_circle(Vector2.ZERO, 3.0, Color("#fff7ed"))
	draw_line(-direction * 16.0, Vector2.ZERO, Color("#f59e0b"), 4.0)
