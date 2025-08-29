// backend/src/core/database/migrations/022_create_notification_templates_table.js
exports.up = function(knex) {
  return knex.schema.createTable('notification_templates', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    
    table.string('name').notNullable(); // 'Grade Published', 'Report Ready'
    table.string('template_key').notNullable(); // Unique identifier for template
    table.enum('type', ['email', 'sms', 'push', 'in_app']).notNullable();
    table.string('subject'); // For email templates
    table.text('content').notNullable(); // Template content with variables
    table.json('variables'); // Available template variables
    table.json('settings'); // Template-specific settings
    
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_system_template').defaultTo(false); // System vs custom templates
    table.timestamps(true, true);
    
    table.unique(['school_id', 'template_key', 'type']);
    table.index(['is_active', 'type']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('notification_templates');
};
